import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { UsersModule } from "../users/users.module";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { GeneratePasswordService } from "./generate-password.service";

@Module({
	imports: [UsersModule, AuthModule],
	controllers: [AdminController],
	providers: [AdminService, GeneratePasswordService]
})
export class AdminModule {}
