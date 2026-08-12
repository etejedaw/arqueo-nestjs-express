import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";

import { EmailAlreadyInUseError } from "../users/users.errors";
import { UsersService } from "../users/users.service";
import { AdminService } from "./admin.service";

@Injectable()
export class InitialAdminService implements OnApplicationBootstrap {
	static readonly NAME = "Admin";
	static readonly EMAIL = "admin@arqueo.local";

	private readonly logger = new Logger(InitialAdminService.name);

	constructor(
		private readonly usersService: UsersService,
		private readonly adminService: AdminService
	) {}

	async onApplicationBootstrap(): Promise<void> {
		await this.ensureAdminExists();
	}

	async ensureAdminExists(): Promise<void> {
		if (await this.usersService.hasActiveAdmin()) return;

		try {
			const { password } = await this.adminService.create({
				name: InitialAdminService.NAME,
				email: InitialAdminService.EMAIL,
				isAdmin: true
			});
			this.logger.warn(
				`No active admin found. Created ${InitialAdminService.EMAIL} with password ${password}. Change it after logging in.`
			);
		} catch (error) {
			if (!(error instanceof EmailAlreadyInUseError)) throw error;

			this.logger.error(
				`No active admin found and ${InitialAdminService.EMAIL} is already taken by a non-admin or deactivated user. Fix it in the database.`
			);
		}
	}
}
