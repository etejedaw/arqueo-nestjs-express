import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";

import databaseConfig from "./config/database.config";
import { UsersModule } from "./users/users.module";

@Module({
	imports: [
		ConfigModule.forRoot({
			load: [databaseConfig]
		}),
		TypeOrmModule.forRootAsync(databaseConfig.asProvider()),
		UsersModule
	],
	controllers: [],
	providers: []
})
export class AppModule {}
