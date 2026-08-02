import { ValidationPipe, VersioningType } from "@nestjs/common";
import { ConfigType } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import cookieParser from "cookie-parser";
import helmet from "helmet";

import { AppModule } from "./app.module";
import appConfig from "./config/app.config";
import corsConfig from "./config/cors.config";

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	const config = app.get<ConfigType<typeof appConfig>>(appConfig.KEY);
	const cors = app.get<ConfigType<typeof corsConfig>>(corsConfig.KEY);

	app.use(helmet());
	app.use(cookieParser());
	app.enableCors(cors);
	app.enableVersioning({ type: VersioningType.URI, defaultVersion: "1" });
	app.enableShutdownHooks();

	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			forbidNonWhitelisted: true,
			transform: true
		})
	);

	await app.listen(config.port);
}
void bootstrap();
