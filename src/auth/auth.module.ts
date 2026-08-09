import { Module } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import { JwtModule } from "@nestjs/jwt";

import authConfig from "../common/config/auth.config";
import { HashingModule } from "../common/hashing/hashing.module";
import { UsersModule } from "../users/users.module";
import { AuthController } from "./auth.controller";
import { AuthErrorsFilter } from "./auth.errors";
import { AuthService } from "./auth.service";

@Module({
	imports: [
		UsersModule,
		HashingModule,
		JwtModule.registerAsync({ ...authConfig.asProvider(), global: true })
	],
	controllers: [AuthController],
	providers: [
		AuthService,
		{ provide: APP_FILTER, useClass: AuthErrorsFilter }
	],
	exports: [AuthService]
})
export class AuthModule {}
