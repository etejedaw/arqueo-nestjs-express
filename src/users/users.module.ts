import { Module } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import { TypeOrmModule } from "@nestjs/typeorm";

import { HashingModule } from "../common/hashing/hashing.module";
import { User } from "./entities/user.entity";
import { UsersController } from "./users.controller";
import { UsersErrorsFilter } from "./users.errors";
import { UsersService } from "./users.service";

@Module({
	imports: [TypeOrmModule.forFeature([User]), HashingModule],
	controllers: [UsersController],
	providers: [
		UsersService,
		{ provide: APP_FILTER, useClass: UsersErrorsFilter }
	],
	exports: [TypeOrmModule, UsersService]
})
export class UsersModule {}
