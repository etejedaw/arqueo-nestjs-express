import { Test } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";

import { HashingService } from "../../src/common/hashing/hashing.service";
import { CreateUserDto } from "../../src/users/dto/create-user.dto";
import { User } from "../../src/users/entities/user.entity";
import {
	EmailAlreadyInUseError,
	LastAdminError,
	UserNotFoundError
} from "../../src/users/users.errors";
import { UsersService } from "../../src/users/users.service";

const USER_ID = "3f1c2a9e-6b1d-4c3e-9a7f-2d5e8b0c4a11";
const OTHER_ADMIN_ID = "b7e4d0c2-1a3f-4e5b-8c6d-9f0a1b2c3d44";
const TIMESTAMP = new Date("2026-09-01T12:00:00.000Z");
const WRITE_LOCK = { mode: "pessimistic_write" };

function buildUser(overrides: Partial<User> = {}): User {
	return Object.assign(new User(), {
		id: USER_ID,
		name: "Ada Lovelace",
		email: "ada@arqueo.local",
		password: "hashed-password",
		isAdmin: false,
		createdAt: TIMESTAMP,
		updatedAt: TIMESTAMP,
		deletedAt: null,
		...overrides
	});
}

function buildOtherAdmin(): User {
	return buildUser({
		id: OTHER_ADMIN_ID,
		email: "grace@arqueo.local",
		isAdmin: true
	});
}

function createManagerMock() {
	return {
		find: jest.fn(),
		findOne: jest.fn(),
		merge: jest.fn(),
		save: jest.fn(),
		softDelete: jest.fn(),
		delete: jest.fn().mockResolvedValue({ raw: [], affected: 1 })
	};
}

type ManagerMock = ReturnType<typeof createManagerMock>;

function createRepositoryMock(manager: ManagerMock) {
	return {
		create: jest.fn(),
		save: jest.fn(),
		find: jest.fn(),
		findOne: jest.fn(),
		findOneBy: jest.fn(),
		restore: jest.fn(),
		update: jest.fn(),
		manager: {
			transaction: jest.fn(
				(work: (entityManager: ManagerMock) => Promise<unknown>) =>
					work(manager)
			)
		}
	};
}

describe("UsersService", () => {
	let service: UsersService;
	let manager: ManagerMock;
	let repository: ReturnType<typeof createRepositoryMock>;
	let hashingService: { hash: jest.Mock; verify: jest.Mock };

	function givenLockedRows(activeAdmins: User[], user: User | null): void {
		manager.find.mockResolvedValue(activeAdmins);
		manager.findOne.mockResolvedValue(user);
	}

	beforeEach(async () => {
		manager = createManagerMock();
		repository = createRepositoryMock(manager);
		hashingService = {
			hash: jest.fn().mockResolvedValue("new-hashed-password"),
			verify: jest.fn().mockResolvedValue(true)
		};

		const moduleRef = await Test.createTestingModule({
			providers: [
				UsersService,
				{ provide: getRepositoryToken(User), useValue: repository },
				{ provide: HashingService, useValue: hashingService }
			]
		}).compile();

		service = moduleRef.get(UsersService);
	});

	describe("create", () => {
		const input: CreateUserDto = {
			name: "Ada Lovelace",
			email: "ada@arqueo.local",
			password: "hashed-password"
		};

		it("saves the user when the email is free and returns the persisted entity", async () => {
			const built = Object.assign(new User(), input);
			const persisted = buildUser();
			repository.findOne.mockResolvedValue(null);
			repository.create.mockReturnValue(built);
			repository.save.mockResolvedValue(persisted);

			await expect(service.create(input)).resolves.toBe(persisted);
			expect(repository.findOne).toHaveBeenCalledWith({
				where: { email: input.email },
				withDeleted: true
			});
			expect(repository.create).toHaveBeenCalledWith(input);
			expect(repository.save).toHaveBeenCalledWith(built);
		});

		it("throws EmailAlreadyInUseError without saving when an active user has the email", async () => {
			repository.findOne.mockResolvedValue(buildUser());

			const result = service.create(input);

			await expect(result).rejects.toBeInstanceOf(EmailAlreadyInUseError);
			await expect(result).rejects.toMatchObject({ email: input.email });
			expect(repository.save).not.toHaveBeenCalled();
		});

		it("throws EmailAlreadyInUseError without saving when a deactivated user has the email", async () => {
			repository.findOne.mockResolvedValue(
				buildUser({ deletedAt: TIMESTAMP })
			);

			await expect(service.create(input)).rejects.toBeInstanceOf(
				EmailAlreadyInUseError
			);
			expect(repository.save).not.toHaveBeenCalled();
		});

		it("rethrows any error from saving untouched", async () => {
			const error = new Error("connection lost");
			repository.findOne.mockResolvedValue(null);
			repository.create.mockReturnValue(Object.assign(new User(), input));
			repository.save.mockRejectedValue(error);

			await expect(service.create(input)).rejects.toBe(error);
		});
	});

	describe("findAll", () => {
		it("returns only the active users when the scope is active", async () => {
			const users = [buildUser(), buildOtherAdmin()];
			repository.find.mockResolvedValue(users);

			await expect(service.findAll("active")).resolves.toBe(users);
			expect(repository.find).toHaveBeenCalledWith({
				withDeleted: false
			});
		});

		it("includes the deactivated users when the scope is all", async () => {
			const users = [buildUser(), buildOtherAdmin()];
			repository.find.mockResolvedValue(users);

			await expect(service.findAll("all")).resolves.toBe(users);
			expect(repository.find).toHaveBeenCalledWith({ withDeleted: true });
		});
	});

	describe("findById", () => {
		it("looks only among the active users when the scope is active", async () => {
			const user = buildUser();
			repository.findOne.mockResolvedValue(user);

			await expect(service.findById(USER_ID, "active")).resolves.toBe(
				user
			);
			expect(repository.findOne).toHaveBeenCalledWith({
				where: { id: USER_ID },
				withDeleted: false
			});
		});

		it("also finds a deactivated user when the scope is all", async () => {
			const user = buildUser({ deletedAt: TIMESTAMP });
			repository.findOne.mockResolvedValue(user);

			await expect(service.findById(USER_ID, "all")).resolves.toBe(user);
			expect(repository.findOne).toHaveBeenCalledWith({
				where: { id: USER_ID },
				withDeleted: true
			});
		});

		it("throws UserNotFoundError when no user has the given id", async () => {
			repository.findOne.mockResolvedValue(null);

			const result = service.findById(USER_ID, "all");

			await expect(result).rejects.toBeInstanceOf(UserNotFoundError);
			await expect(result).rejects.toMatchObject({ userId: USER_ID });
		});
	});

	describe("findByEmail", () => {
		it("returns the user with the given email", async () => {
			const user = buildUser();
			repository.findOneBy.mockResolvedValue(user);

			await expect(service.findByEmail(user.email)).resolves.toBe(user);
			expect(repository.findOneBy).toHaveBeenCalledWith({
				email: user.email
			});
		});

		it("returns null when no user has the given email", async () => {
			repository.findOneBy.mockResolvedValue(null);

			await expect(
				service.findByEmail("nobody@arqueo.local")
			).resolves.toBeNull();
		});
	});

	describe("update", () => {
		it("merges the changes inside a transaction and returns the reloaded user", async () => {
			const user = buildUser();
			const reloaded = buildUser({ name: "Ada King" });
			manager.find.mockResolvedValue([buildOtherAdmin()]);
			manager.findOne
				.mockResolvedValueOnce(user)
				.mockResolvedValueOnce(reloaded);

			await expect(
				service.update(USER_ID, { name: "Ada King" })
			).resolves.toBe(reloaded);
			expect(repository.manager.transaction).toHaveBeenCalledTimes(1);
			expect(manager.findOne).toHaveBeenCalledWith(User, {
				where: { id: USER_ID },
				withDeleted: false,
				lock: WRITE_LOCK
			});
			expect(manager.merge).toHaveBeenCalledWith(User, user, {
				name: "Ada King"
			});
			expect(manager.save).toHaveBeenCalledWith(user);
		});

		it("removes isAdmin from an admin when another active admin remains", async () => {
			const user = buildUser({ isAdmin: true });
			givenLockedRows([user, buildOtherAdmin()], user);

			await service.update(USER_ID, { isAdmin: false });

			expect(manager.save).toHaveBeenCalledWith(user);
		});

		it("throws LastAdminError when removing isAdmin from the only active admin", async () => {
			const user = buildUser({ isAdmin: true });
			givenLockedRows([user], user);

			const result = service.update(USER_ID, { isAdmin: false });

			await expect(result).rejects.toBeInstanceOf(LastAdminError);
			await expect(result).rejects.toMatchObject({ userId: USER_ID });
			expect(manager.save).not.toHaveBeenCalled();
		});

		it("lets the only active admin change other fields", async () => {
			const user = buildUser({ isAdmin: true });
			givenLockedRows([user], user);

			await service.update(USER_ID, { name: "Ada King" });

			expect(manager.save).toHaveBeenCalledWith(user);
		});

		it("throws UserNotFoundError without saving when the user does not exist or is deactivated", async () => {
			givenLockedRows([buildOtherAdmin()], null);

			await expect(
				service.update(USER_ID, { name: "Ada King" })
			).rejects.toBeInstanceOf(UserNotFoundError);
			expect(manager.save).not.toHaveBeenCalled();
		});

		it("changes the email when no other user has it", async () => {
			const user = buildUser();
			manager.find.mockResolvedValue([buildOtherAdmin()]);
			manager.findOne
				.mockResolvedValueOnce(user)
				.mockResolvedValueOnce(null)
				.mockResolvedValueOnce(user);

			await service.update(USER_ID, { email: "ada.king@arqueo.local" });

			expect(manager.findOne).toHaveBeenNthCalledWith(2, User, {
				where: { email: "ada.king@arqueo.local" },
				withDeleted: true
			});
			expect(manager.save).toHaveBeenCalledWith(user);
		});

		it("throws EmailAlreadyInUseError without saving when another user, even a deactivated one, has the email", async () => {
			const user = buildUser();
			manager.find.mockResolvedValue([buildOtherAdmin()]);
			manager.findOne.mockResolvedValueOnce(user).mockResolvedValueOnce(
				buildUser({
					id: OTHER_ADMIN_ID,
					email: "grace@arqueo.local",
					deletedAt: TIMESTAMP
				})
			);

			const result = service.update(USER_ID, {
				email: "grace@arqueo.local"
			});

			await expect(result).rejects.toBeInstanceOf(EmailAlreadyInUseError);
			await expect(result).rejects.toMatchObject({
				email: "grace@arqueo.local"
			});
			expect(manager.save).not.toHaveBeenCalled();
		});

		it("does not look up the email when it is the user's current one", async () => {
			const user = buildUser();
			givenLockedRows([buildOtherAdmin()], user);

			await service.update(USER_ID, { email: "ada@arqueo.local" });

			expect(manager.findOne).toHaveBeenCalledTimes(2);
			expect(manager.save).toHaveBeenCalledWith(user);
		});
	});

	describe("updatePassword", () => {
		it("replaces the password of an active user with the given hash", async () => {
			repository.findOne.mockResolvedValue(buildUser());

			await service.updatePassword(USER_ID, "new-hashed-password");

			expect(repository.findOne).toHaveBeenCalledWith({
				where: { id: USER_ID },
				withDeleted: false
			});
			expect(repository.update).toHaveBeenCalledWith(USER_ID, {
				password: "new-hashed-password"
			});
		});

		it("throws UserNotFoundError without updating when the user does not exist or is deactivated", async () => {
			repository.findOne.mockResolvedValue(null);

			await expect(
				service.updatePassword(USER_ID, "new-hashed-password")
			).rejects.toBeInstanceOf(UserNotFoundError);
			expect(repository.update).not.toHaveBeenCalled();
		});
	});

	describe("changePassword", () => {
		const input = { password: "arriendo-marzo-475000" };

		it("stores only the hash of the given password", async () => {
			repository.findOne.mockResolvedValue(buildUser());

			await service.changePassword(USER_ID, input);

			expect(hashingService.hash).toHaveBeenCalledWith(input.password);
			expect(repository.update).toHaveBeenCalledWith(USER_ID, {
				password: "new-hashed-password"
			});
		});

		it("does not ask for or compare the current password", async () => {
			repository.findOne.mockResolvedValue(buildUser());

			await service.changePassword(USER_ID, input);

			expect(hashingService.verify).not.toHaveBeenCalled();
		});

		it("looks only among the active users", async () => {
			repository.findOne.mockResolvedValue(buildUser());

			await service.changePassword(USER_ID, input);

			expect(repository.findOne).toHaveBeenCalledWith({
				where: { id: USER_ID },
				withDeleted: false
			});
		});

		it("throws UserNotFoundError without updating when the user does not exist or is deactivated", async () => {
			repository.findOne.mockResolvedValue(null);

			await expect(
				service.changePassword(USER_ID, input)
			).rejects.toBeInstanceOf(UserNotFoundError);
			expect(repository.update).not.toHaveBeenCalled();
		});
	});

	describe("remove", () => {
		it("locks the active admins before the user, inside a transaction", async () => {
			givenLockedRows([buildOtherAdmin()], buildUser());

			await service.remove(USER_ID);

			expect(repository.manager.transaction).toHaveBeenCalledTimes(1);
			expect(manager.find).toHaveBeenCalledWith(User, {
				where: { isAdmin: true },
				order: { id: "ASC" },
				lock: WRITE_LOCK
			});
			expect(manager.findOne).toHaveBeenCalledWith(User, {
				where: { id: USER_ID },
				withDeleted: true,
				lock: WRITE_LOCK
			});
			expect(manager.find.mock.invocationCallOrder[0]).toBeLessThan(
				manager.findOne.mock.invocationCallOrder[0]
			);
		});

		it("soft deletes a regular user and returns true", async () => {
			givenLockedRows([buildOtherAdmin()], buildUser());

			await expect(service.remove(USER_ID)).resolves.toBe(true);
			expect(manager.softDelete).toHaveBeenCalledWith(User, USER_ID);
		});

		it("soft deletes an admin when another active admin remains", async () => {
			const user = buildUser({ isAdmin: true });
			givenLockedRows([user, buildOtherAdmin()], user);

			await expect(service.remove(USER_ID)).resolves.toBe(true);
			expect(manager.softDelete).toHaveBeenCalledWith(User, USER_ID);
		});

		it("throws LastAdminError when the user is the only active admin", async () => {
			const user = buildUser({ isAdmin: true });
			givenLockedRows([user], user);

			await expect(service.remove(USER_ID)).rejects.toBeInstanceOf(
				LastAdminError
			);
			expect(manager.softDelete).not.toHaveBeenCalled();
		});

		it("does nothing and returns false when the user is already deactivated", async () => {
			givenLockedRows(
				[buildOtherAdmin()],
				buildUser({ deletedAt: TIMESTAMP })
			);

			await expect(service.remove(USER_ID)).resolves.toBe(false);
			expect(manager.softDelete).not.toHaveBeenCalled();
		});

		it("throws UserNotFoundError when the user does not exist", async () => {
			givenLockedRows([buildOtherAdmin()], null);

			await expect(service.remove(USER_ID)).rejects.toBeInstanceOf(
				UserNotFoundError
			);
			expect(manager.softDelete).not.toHaveBeenCalled();
		});
	});

	describe("reactivate", () => {
		it("restores a deactivated user", async () => {
			repository.findOne.mockResolvedValue(
				buildUser({ deletedAt: TIMESTAMP })
			);

			await service.reactivate(USER_ID);

			expect(repository.findOne).toHaveBeenCalledWith({
				where: { id: USER_ID },
				withDeleted: true
			});
			expect(repository.restore).toHaveBeenCalledWith(USER_ID);
		});

		it("does nothing when the user is already active", async () => {
			repository.findOne.mockResolvedValue(buildUser());

			await service.reactivate(USER_ID);

			expect(repository.restore).not.toHaveBeenCalled();
		});

		it("throws UserNotFoundError when the user does not exist", async () => {
			repository.findOne.mockResolvedValue(null);

			await expect(service.reactivate(USER_ID)).rejects.toBeInstanceOf(
				UserNotFoundError
			);
			expect(repository.restore).not.toHaveBeenCalled();
		});
	});

	describe("delete", () => {
		it("hard deletes a regular user and returns true", async () => {
			givenLockedRows([buildOtherAdmin()], buildUser());

			await expect(service.delete(USER_ID)).resolves.toBe(true);
			expect(manager.delete).toHaveBeenCalledWith(User, USER_ID);
		});

		it("hard deletes a deactivated admin even when a single active admin remains", async () => {
			givenLockedRows(
				[buildOtherAdmin()],
				buildUser({ isAdmin: true, deletedAt: TIMESTAMP })
			);

			await expect(service.delete(USER_ID)).resolves.toBe(true);
			expect(manager.delete).toHaveBeenCalledWith(User, USER_ID);
		});

		it("returns false when the database reports no deleted rows", async () => {
			givenLockedRows([buildOtherAdmin()], buildUser());
			manager.delete.mockResolvedValue({ raw: [], affected: 0 });

			await expect(service.delete(USER_ID)).resolves.toBe(false);
		});

		it("returns false when the database does not report the affected rows", async () => {
			givenLockedRows([buildOtherAdmin()], buildUser());
			manager.delete.mockResolvedValue({ raw: [] });

			await expect(service.delete(USER_ID)).resolves.toBe(false);
		});

		it("throws LastAdminError when the user is the only active admin", async () => {
			const user = buildUser({ isAdmin: true });
			givenLockedRows([user], user);

			await expect(service.delete(USER_ID)).rejects.toBeInstanceOf(
				LastAdminError
			);
			expect(manager.delete).not.toHaveBeenCalled();
		});

		it("throws UserNotFoundError when the user does not exist", async () => {
			givenLockedRows([buildOtherAdmin()], null);

			await expect(service.delete(USER_ID)).rejects.toBeInstanceOf(
				UserNotFoundError
			);
			expect(manager.delete).not.toHaveBeenCalled();
		});
	});
});
