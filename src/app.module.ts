import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AuthModule } from "./auth/auth.module";
import appConfig from "./config/app.config";
import corsConfig from "./config/cors.config";
import databaseConfig from "./config/database.config";
import { UsersModule } from "./users/users.module";

@Module({
	imports: [
		ConfigModule.forRoot({
			load: [appConfig, corsConfig, databaseConfig]
		}),
		ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
		TypeOrmModule.forRootAsync(databaseConfig.asProvider()),
		UsersModule,
		AuthModule
	],
	controllers: [],
	providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }]
})
export class AppModule {}
