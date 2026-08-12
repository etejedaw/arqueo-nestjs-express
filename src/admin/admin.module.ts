import { Module } from "@nestjs/common";

import { HashingModule } from "../common/hashing/hashing.module";
import { UsersModule } from "../users/users.module";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { GeneratePasswordService } from "./generate-password.service";
import { InitialAdminService } from "./initial-admin.service";

@Module({
	imports: [UsersModule, HashingModule],
	controllers: [AdminController],
	providers: [AdminService, GeneratePasswordService, InitialAdminService]
})
export class AdminModule {}
