import { Module } from "@nestjs/common";

import { UsersModule } from "../users/users.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { HashingService } from "./hashing.service";

@Module({
	imports: [UsersModule],
	controllers: [AuthController],
	providers: [AuthService, HashingService],
	exports: [AuthService, HashingService]
})
export class AuthModule {}
