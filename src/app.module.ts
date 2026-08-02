import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { TypeOrmModule } from "@nestjs/typeorm";

import appConfig from "./config/app.config";
import databaseConfig from "./config/database.config";
import { UsersModule } from "./users/users.module";

@Module({
	imports: [
		ConfigModule.forRoot({
			load: [appConfig, databaseConfig]
		}),
		ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
		TypeOrmModule.forRootAsync(databaseConfig.asProvider()),
		UsersModule
	],
	controllers: [],
	providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }]
})
export class AppModule {}
