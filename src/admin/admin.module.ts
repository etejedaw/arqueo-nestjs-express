import { Module } from "@nestjs/common";

import { HashingModule } from "../common/hashing/hashing.module";
import { UsersModule } from "../users/users.module";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { GeneratePasswordService } from "./generate-password.service";

@Module({
	imports: [UsersModule, HashingModule],
	controllers: [AdminController],
	providers: [AdminService, GeneratePasswordService]
})
export class AdminModule {}
