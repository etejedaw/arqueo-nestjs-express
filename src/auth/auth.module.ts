import { Module } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import { JwtModule } from "@nestjs/jwt";

import authConfig from "../common/config/auth.config";
import { UsersModule } from "../users/users.module";
import { AuthController } from "./auth.controller";
import { AuthErrorsFilter } from "./auth.errors";
import { AuthService } from "./auth.service";
import { HashingService } from "./hashing.service";

@Module({
	imports: [UsersModule, JwtModule.registerAsync(authConfig.asProvider())],
	controllers: [AuthController],
	providers: [
		AuthService,
		HashingService,
		{ provide: APP_FILTER, useClass: AuthErrorsFilter }
	],
	exports: [AuthService, HashingService]
})
export class AuthModule {}
