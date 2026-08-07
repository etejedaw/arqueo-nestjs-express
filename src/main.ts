import {
	ClassSerializerInterceptor,
	ConsoleLogger,
	HttpStatus,
	ValidationPipe,
	VersioningType
} from "@nestjs/common";
import { ConfigType } from "@nestjs/config";
import { NestFactory, Reflector } from "@nestjs/core";
import cookieParser from "cookie-parser";
import helmet from "helmet";

import { AppModule } from "./app.module";
import appConfig from "./common/config/app.config";
import corsConfig from "./common/config/cors.config";

async function bootstrap() {
	const app = await NestFactory.create(AppModule, { bufferLogs: true });

	const config = app.get<ConfigType<typeof appConfig>>(appConfig.KEY);
	const cors = app.get<ConfigType<typeof corsConfig>>(corsConfig.KEY);

	app.useLogger(
		new ConsoleLogger({
			prefix: "Arqueo",
			logLevels: config.logLevels,
			colors: config.nodeEnv === "dev"
		})
	);

	app.use(helmet());
	app.use(cookieParser());
	app.enableCors(cors);
	app.setGlobalPrefix("api");
	app.enableVersioning({ type: VersioningType.URI, defaultVersion: "1" });
	app.enableShutdownHooks();

	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			forbidNonWhitelisted: true,
			transform: true,
			errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY
		})
	);
	app.useGlobalInterceptors(
		new ClassSerializerInterceptor(app.get(Reflector), {
			excludeExtraneousValues: true
		})
	);

	await app.listen(config.port);
}
void bootstrap();
