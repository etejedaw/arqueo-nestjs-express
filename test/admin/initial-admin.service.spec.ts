import { Logger } from "@nestjs/common";
import { Test } from "@nestjs/testing";

import { AdminService } from "../../src/admin/admin.service";
import { InitialAdminService } from "../../src/admin/initial-admin.service";
import { EmailAlreadyInUseError } from "../../src/users/users.errors";
import { UsersService } from "../../src/users/users.service";

const GENERATED_PASSWORD = "9f3a0c7e";

describe("InitialAdminService", () => {
	let service: InitialAdminService;
	let usersService: { hasActiveAdmin: jest.Mock };
	let adminService: { create: jest.Mock };
	let warn: jest.SpyInstance;
	let error: jest.SpyInstance;

	beforeEach(async () => {
		usersService = { hasActiveAdmin: jest.fn() };
		adminService = {
			create: jest
				.fn()
				.mockResolvedValue({ password: GENERATED_PASSWORD })
		};
		warn = jest.spyOn(Logger.prototype, "warn").mockImplementation();
		error = jest.spyOn(Logger.prototype, "error").mockImplementation();

		const moduleRef = await Test.createTestingModule({
			providers: [
				InitialAdminService,
				{ provide: UsersService, useValue: usersService },
				{ provide: AdminService, useValue: adminService }
			]
		}).compile();

		service = moduleRef.get(InitialAdminService);
	});

	afterEach(() => jest.restoreAllMocks());

	it("runs on application bootstrap", async () => {
		usersService.hasActiveAdmin.mockResolvedValue(true);

		await service.onApplicationBootstrap();

		expect(usersService.hasActiveAdmin).toHaveBeenCalled();
	});

	it("does nothing when an active admin exists", async () => {
		usersService.hasActiveAdmin.mockResolvedValue(true);

		await service.ensureAdminExists();

		expect(adminService.create).not.toHaveBeenCalled();
		expect(warn).not.toHaveBeenCalled();
	});

	it("creates the initial admin and logs its password when there is no active admin", async () => {
		usersService.hasActiveAdmin.mockResolvedValue(false);

		await service.ensureAdminExists();

		expect(adminService.create).toHaveBeenCalledWith({
			name: "Admin",
			email: "admin@arqueo.local",
			isAdmin: true
		});
		expect(warn).toHaveBeenCalledWith(
			expect.stringContaining(GENERATED_PASSWORD)
		);
	});

	it("logs an error without throwing when the email is already taken", async () => {
		usersService.hasActiveAdmin.mockResolvedValue(false);
		adminService.create.mockRejectedValue(
			new EmailAlreadyInUseError("admin@arqueo.local")
		);

		await expect(service.ensureAdminExists()).resolves.toBeUndefined();

		expect(error).toHaveBeenCalledWith(
			expect.stringContaining("admin@arqueo.local")
		);
	});

	it("rethrows any other error", async () => {
		const failure = new Error("connection lost");
		usersService.hasActiveAdmin.mockResolvedValue(false);
		adminService.create.mockRejectedValue(failure);

		await expect(service.ensureAdminExists()).rejects.toBe(failure);
	});
});
