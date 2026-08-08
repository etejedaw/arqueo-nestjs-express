import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AdminModule } from "./admin/admin.module";
import { AuthModule } from "./auth/auth.module";
import appConfig from "./common/config/app.config";
import authConfig from "./common/config/auth.config";
import corsConfig from "./common/config/cors.config";
import databaseConfig from "./common/config/database.config";
import { UsersModule } from "./users/users.module";

@Module({
	imports: [
		ConfigModule.forRoot({
			load: [appConfig, authConfig, corsConfig, databaseConfig]
		}),
		ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
		TypeOrmModule.forRootAsync(databaseConfig.asProvider()),
		UsersModule,
		AuthModule,
		AdminModule
	],
	controllers: [],
	providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }]
})
export class AppModule {}
