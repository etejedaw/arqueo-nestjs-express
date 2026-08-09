import { Test } from "@nestjs/testing";

import { AdminService } from "../../src/admin/admin.service";
import { GeneratePasswordService } from "../../src/admin/generate-password.service";
import { HashingService } from "../../src/common/hashing/hashing.service";
import { User } from "../../src/users/entities/user.entity";
import {
	LastAdminError,
	UserNotFoundError
} from "../../src/users/users.errors";
import { UsersService } from "../../src/users/users.service";

const USER_ID = "3f1c2a9e-6b1d-4c3e-9a7f-2d5e8b0c4a11";
const TIMESTAMP = new Date("2026-09-01T12:00:00.000Z");
const GENERATED_PASSWORD = "9f3a0c7e";
const HASHED_PASSWORD = "$2b$12$hashed";

function buildUser(overrides: Partial<User> = {}): User {
	return Object.assign(new User(), {
		id: USER_ID,
		name: "Ada Lovelace",
		email: "ada@arqueo.local",
		password: HASHED_PASSWORD,
		isAdmin: false,
		createdAt: TIMESTAMP,
		updatedAt: TIMESTAMP,
		deletedAt: null,
		...overrides
	});
}

function createUsersServiceMock() {
	return {
		create: jest.fn(),
		findAll: jest.fn(),
		findById: jest.fn(),
		update: jest.fn(),
		updatePassword: jest.fn(),
		remove: jest.fn(),
		reactivate: jest.fn(),
		delete: jest.fn()
	};
}

describe("AdminService", () => {
	let service: AdminService;
	let usersService: ReturnType<typeof createUsersServiceMock>;
	let generatePasswordService: { generatePassword: jest.Mock };
	let hashingService: { hash: jest.Mock };

	beforeEach(async () => {
		usersService = createUsersServiceMock();
		generatePasswordService = {
			generatePassword: jest.fn().mockReturnValue(GENERATED_PASSWORD)
		};
		hashingService = { hash: jest.fn().mockResolvedValue(HASHED_PASSWORD) };

		const moduleRef = await Test.createTestingModule({
			providers: [
				AdminService,
				{ provide: UsersService, useValue: usersService },
				{
					provide: GeneratePasswordService,
					useValue: generatePasswordService
				},
				{ provide: HashingService, useValue: hashingService }
			]
		}).compile();

		service = moduleRef.get(AdminService);
	});

	describe("create", () => {
		const input = {
			name: "Ada Lovelace",
			email: "ada@arqueo.local",
			isAdmin: false
		};

		it("creates the user with the hash of a generated password", async () => {
			usersService.create.mockResolvedValue(buildUser());

			await service.create(input);

			expect(hashingService.hash).toHaveBeenCalledWith(
				GENERATED_PASSWORD
			);
			expect(usersService.create).toHaveBeenCalledWith({
				name: input.name,
				email: input.email,
				password: HASHED_PASSWORD,
				isAdmin: input.isAdmin
			});
		});

		it("returns the created user together with the plain generated password", async () => {
			const user = buildUser();
			usersService.create.mockResolvedValue(user);

			await expect(service.create(input)).resolves.toEqual({
				user,
				password: GENERATED_PASSWORD
			});
		});

		it("rethrows any error from the users service untouched", async () => {
			const error = new Error("connection lost");
			usersService.create.mockRejectedValue(error);

			await expect(service.create(input)).rejects.toBe(error);
		});
	});

	describe("resetPassword", () => {
		it("stores the hash of a generated password and returns the plain one", async () => {
			usersService.updatePassword.mockResolvedValue(undefined);

			await expect(service.resetPassword(USER_ID)).resolves.toBe(
				GENERATED_PASSWORD
			);
			expect(hashingService.hash).toHaveBeenCalledWith(
				GENERATED_PASSWORD
			);
			expect(usersService.updatePassword).toHaveBeenCalledWith(
				USER_ID,
				HASHED_PASSWORD
			);
		});

		it("rethrows UserNotFoundError from the users service untouched", async () => {
			const error = new UserNotFoundError(USER_ID);
			usersService.updatePassword.mockRejectedValue(error);

			await expect(service.resetPassword(USER_ID)).rejects.toBe(error);
		});
	});

	describe("findAllUsers", () => {
		it("returns every user, including the deactivated ones", async () => {
			const users = [buildUser(), buildUser({ deletedAt: TIMESTAMP })];
			usersService.findAll.mockResolvedValue(users);

			await expect(service.findAllUsers()).resolves.toBe(users);
			expect(usersService.findAll).toHaveBeenCalledWith("all");
		});
	});

	describe("findUser", () => {
		it("returns the user with the given id, even when deactivated", async () => {
			const user = buildUser({ deletedAt: TIMESTAMP });
			usersService.findById.mockResolvedValue(user);

			await expect(service.findUser(USER_ID)).resolves.toBe(user);
			expect(usersService.findById).toHaveBeenCalledWith(USER_ID, "all");
		});
	});

	describe("updateUser", () => {
		it("applies the changes and returns the updated user", async () => {
			const updated = buildUser({ name: "Ada King" });
			usersService.update.mockResolvedValue(updated);

			await expect(
				service.updateUser(USER_ID, { name: "Ada King" })
			).resolves.toBe(updated);
			expect(usersService.update).toHaveBeenCalledWith(USER_ID, {
				name: "Ada King"
			});
		});

		it("rethrows LastAdminError from the users service untouched", async () => {
			const error = new LastAdminError(USER_ID);
			usersService.update.mockRejectedValue(error);

			await expect(
				service.updateUser(USER_ID, { isAdmin: false })
			).rejects.toBe(error);
		});
	});

	describe("deactivateUser", () => {
		it.each([true, false])(
			"returns %s as reported by the users service",
			async deactivated => {
				usersService.remove.mockResolvedValue(deactivated);

				await expect(service.deactivateUser(USER_ID)).resolves.toBe(
					deactivated
				);
				expect(usersService.remove).toHaveBeenCalledWith(USER_ID);
			}
		);
	});

	describe("activateUser", () => {
		it("reactivates the user with the given id", async () => {
			usersService.reactivate.mockResolvedValue(undefined);

			await expect(
				service.activateUser(USER_ID)
			).resolves.toBeUndefined();
			expect(usersService.reactivate).toHaveBeenCalledWith(USER_ID);
		});
	});

	describe("deleteUser", () => {
		it.each([true, false])(
			"returns %s as reported by the users service",
			async deleted => {
				usersService.delete.mockResolvedValue(deleted);

				await expect(service.deleteUser(USER_ID)).resolves.toBe(
					deleted
				);
				expect(usersService.delete).toHaveBeenCalledWith(USER_ID);
			}
		);
	});
});
