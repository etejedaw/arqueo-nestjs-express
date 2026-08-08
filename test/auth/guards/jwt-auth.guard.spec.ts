import { ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Test } from "@nestjs/testing";

import { JwtAuthGuard } from "../../../src/auth/guards/jwt-auth.guard";
import { AuthUser } from "../../../src/auth/interfaces/auth-user.interface";
import { User } from "../../../src/users/entities/user.entity";
import { UserNotFoundError } from "../../../src/users/users.errors";
import { UsersService } from "../../../src/users/users.service";

const USER_ID = "3f1c2a9e-6b1d-4c3e-9a7f-2d5e8b0c4a11";
const TIMESTAMP = new Date("2026-09-01T12:00:00.000Z");
const ACCESS_TOKEN = "header.payload.signature";

interface FakeRequest {
	headers: { authorization?: string };
	user?: AuthUser;
}

function buildUser(): User {
	return Object.assign(new User(), {
		id: USER_ID,
		name: "Ada Lovelace",
		email: "ada@arqueo.local",
		password: "hashed-password",
		isAdmin: false,
		createdAt: TIMESTAMP,
		updatedAt: TIMESTAMP,
		deletedAt: null
	});
}

function buildContext(request: FakeRequest): ExecutionContext {
	return {
		switchToHttp: () => ({ getRequest: () => request })
	} as unknown as ExecutionContext;
}

function withAuthorization(authorization?: string): FakeRequest {
	return { headers: { authorization } };
}

describe("JwtAuthGuard", () => {
	let guard: JwtAuthGuard;
	let jwtService: { verifyAsync: jest.Mock };
	let usersService: { findById: jest.Mock };

	beforeEach(async () => {
		jwtService = {
			verifyAsync: jest.fn().mockResolvedValue({ sub: USER_ID })
		};
		usersService = { findById: jest.fn().mockResolvedValue(buildUser()) };

		const moduleRef = await Test.createTestingModule({
			providers: [
				JwtAuthGuard,
				{ provide: JwtService, useValue: jwtService },
				{ provide: UsersService, useValue: usersService }
			]
		}).compile();

		guard = moduleRef.get(JwtAuthGuard);
	});

	it("lets the request through and attaches the user when the token is valid", async () => {
		const request = withAuthorization(`Bearer ${ACCESS_TOKEN}`);

		await expect(guard.canActivate(buildContext(request))).resolves.toBe(
			true
		);
		expect(request.user).toEqual({
			id: USER_ID,
			name: "Ada Lovelace",
			email: "ada@arqueo.local",
			isAdmin: false
		});
	});

	it("leaves the password hash and the timestamps out of the request user", async () => {
		const request = withAuthorization(`Bearer ${ACCESS_TOKEN}`);

		await guard.canActivate(buildContext(request));

		expect(Object.keys(request.user ?? {}).sort()).toEqual([
			"email",
			"id",
			"isAdmin",
			"name"
		]);
	});

	it("verifies the token taken from the bearer header", async () => {
		await guard.canActivate(
			buildContext(withAuthorization(`Bearer ${ACCESS_TOKEN}`))
		);

		expect(jwtService.verifyAsync).toHaveBeenCalledWith(ACCESS_TOKEN);
	});

	it("loads the active user named by the token subject", async () => {
		await guard.canActivate(
			buildContext(withAuthorization(`Bearer ${ACCESS_TOKEN}`))
		);

		expect(usersService.findById).toHaveBeenCalledWith(USER_ID, true);
	});

	it("rejects a request without an authorization header", async () => {
		await expect(
			guard.canActivate(buildContext(withAuthorization()))
		).rejects.toBeInstanceOf(UnauthorizedException);
		expect(jwtService.verifyAsync).not.toHaveBeenCalled();
	});

	it("rejects a scheme other than bearer", async () => {
		await expect(
			guard.canActivate(
				buildContext(withAuthorization(`Basic ${ACCESS_TOKEN}`))
			)
		).rejects.toBeInstanceOf(UnauthorizedException);
		expect(jwtService.verifyAsync).not.toHaveBeenCalled();
	});

	it("rejects a bearer header without a token", async () => {
		await expect(
			guard.canActivate(buildContext(withAuthorization("Bearer ")))
		).rejects.toBeInstanceOf(UnauthorizedException);
		expect(jwtService.verifyAsync).not.toHaveBeenCalled();
	});

	it("rejects a token that fails verification", async () => {
		jwtService.verifyAsync.mockRejectedValue(new Error("jwt expired"));

		await expect(
			guard.canActivate(
				buildContext(withAuthorization(`Bearer ${ACCESS_TOKEN}`))
			)
		).rejects.toBeInstanceOf(UnauthorizedException);
		expect(usersService.findById).not.toHaveBeenCalled();
	});

	it("rejects a valid token whose user was deactivated or deleted", async () => {
		usersService.findById.mockRejectedValue(new UserNotFoundError(USER_ID));

		await expect(
			guard.canActivate(
				buildContext(withAuthorization(`Bearer ${ACCESS_TOKEN}`))
			)
		).rejects.toBeInstanceOf(UnauthorizedException);
	});

	it("rethrows an unexpected error from the users service untouched", async () => {
		const error = new Error("connection lost");
		usersService.findById.mockRejectedValue(error);

		await expect(
			guard.canActivate(
				buildContext(withAuthorization(`Bearer ${ACCESS_TOKEN}`))
			)
		).rejects.toBe(error);
	});
});
