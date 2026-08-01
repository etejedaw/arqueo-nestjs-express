import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";

import appConfig from "./config/app.config";
import databaseConfig from "./config/database.config";
import { UsersModule } from "./users/users.module";

@Module({
	imports: [
		ConfigModule.forRoot({
			load: [appConfig, databaseConfig]
		}),
		TypeOrmModule.forRootAsync(databaseConfig.asProvider()),
		UsersModule
	],
	controllers: [],
	providers: []
})
export class AppModule {}
