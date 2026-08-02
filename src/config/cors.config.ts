import { CorsOptions } from "@nestjs/common/interfaces/external/cors-options.interface";
import { registerAs } from "@nestjs/config";
import { Expose, plainToInstance, Transform } from "class-transformer";
import { IsArray, IsBoolean, IsString, validateSync } from "class-validator";

import { toBoolean, toStringArray } from "./env.transforms";

class CorsConfig {
	@Expose()
	@Transform(toStringArray)
	@IsArray()
	@IsString({ each: true })
	CORS_ORIGINS: string[] = [];

	@Expose()
	@Transform(toBoolean(true))
	@IsBoolean()
	CORS_CREDENTIALS = true;
}

export default registerAs("cors", (): CorsOptions => {
	const corsConfig = plainToInstance(CorsConfig, process.env, {
		excludeExtraneousValues: true,
		exposeDefaultValues: true
	});

	const errors = validateSync(corsConfig);
	if (errors.length > 0)
		throw new Error(`Invalid cors env config: ${errors.toString()}`);

	return {
		origin:
			corsConfig.CORS_ORIGINS.length > 0 ? corsConfig.CORS_ORIGINS : true,
		credentials: corsConfig.CORS_CREDENTIALS
	};
});
