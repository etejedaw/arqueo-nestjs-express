import { JwtService } from "@nestjs/jwt";
import { Test } from "@nestjs/testing";

import { InvalidCredentialsError } from "../../src/auth/auth.errors";
import { AuthService } from "../../src/auth/auth.service";
import { HashingService } from "../../src/common/hashing/hashing.service";
import { User } from "../../src/users/entities/user.entity";
import { UsersService } from "../../src/users/users.service";

const USER_ID = "3f1c2a9e-6b1d-4c3e-9a7f-2d5e8b0c4a11";
const TIMESTAMP = new Date("2026-09-01T12:00:00.000Z");
const HASHED_PASSWORD = "$2b$12$hashed";
const ACCESS_TOKEN = "header.payload.signature";

const CREDENTIALS = {
	email: "ada@arqueo.local",
	password: "correct horse battery staple"
};

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

describe("AuthService", () => {
	let service: AuthService;
	let usersService: { findByEmail: jest.Mock };
	let hashingService: { hash: jest.Mock; verify: jest.Mock };
	let jwtService: { signAsync: jest.Mock };

	beforeEach(async () => {
		usersService = { findByEmail: jest.fn() };
		hashingService = {
			hash: jest.fn().mockResolvedValue(HASHED_PASSWORD),
			verify: jest.fn()
		};
		jwtService = { signAsync: jest.fn().mockResolvedValue(ACCESS_TOKEN) };

		const moduleRef = await Test.createTestingModule({
			providers: [
				AuthService,
				{ provide: UsersService, useValue: usersService },
				{ provide: HashingService, useValue: hashingService },
				{ provide: JwtService, useValue: jwtService }
			]
		}).compile();

		service = moduleRef.get(AuthService);
	});

	describe("login", () => {
		it("returns only the access token when the credentials are valid", async () => {
			usersService.findByEmail.mockResolvedValue(buildUser());
			hashingService.verify.mockResolvedValue(true);

			await expect(service.login(CREDENTIALS)).resolves.toEqual({
				accessToken: ACCESS_TOKEN
			});
			expect(usersService.findByEmail).toHaveBeenCalledWith(
				CREDENTIALS.email
			);
		});

		it("signs the token with the user id as the subject", async () => {
			usersService.findByEmail.mockResolvedValue(buildUser());
			hashingService.verify.mockResolvedValue(true);

			await service.login(CREDENTIALS);

			expect(jwtService.signAsync).toHaveBeenCalledWith({ sub: USER_ID });
		});

		it("compares the given password against the stored hash", async () => {
			const user = buildUser();
			usersService.findByEmail.mockResolvedValue(user);
			hashingService.verify.mockResolvedValue(true);

			await service.login(CREDENTIALS);

			expect(hashingService.verify).toHaveBeenCalledWith(
				CREDENTIALS.password,
				user.password
			);
		});

		it("throws InvalidCredentialsError when the password does not match", async () => {
			usersService.findByEmail.mockResolvedValue(buildUser());
			hashingService.verify.mockResolvedValue(false);

			await expect(service.login(CREDENTIALS)).rejects.toBeInstanceOf(
				InvalidCredentialsError
			);
			expect(jwtService.signAsync).not.toHaveBeenCalled();
		});

		it("throws InvalidCredentialsError when no user has that email", async () => {
			usersService.findByEmail.mockResolvedValue(null);

			await expect(service.login(CREDENTIALS)).rejects.toBeInstanceOf(
				InvalidCredentialsError
			);
			expect(hashingService.verify).not.toHaveBeenCalled();
			expect(jwtService.signAsync).not.toHaveBeenCalled();
		});

		it("rethrows an unexpected error from the users service untouched", async () => {
			const error = new Error("connection lost");
			usersService.findByEmail.mockRejectedValue(error);

			await expect(service.login(CREDENTIALS)).rejects.toBe(error);
		});
	});
});
