import { registerAs } from "@nestjs/config";
import { Expose, plainToInstance, Type } from "class-transformer";
import { IsIn, IsInt, validateSync } from "class-validator";

const NODE_ENVIRONMENTS = ["dev", "prod", "test"] as const;
type NodeEnvironments = (typeof NODE_ENVIRONMENTS)[number];

class AppConfig {
	@Expose()
	@IsIn(NODE_ENVIRONMENTS)
	NODE_ENV: NodeEnvironments = "dev";

	@Expose()
	@IsInt()
	@Type(() => Number)
	PORT = 3000;
}

export default registerAs("app", () => {
	const appConfig = plainToInstance(AppConfig, process.env, {
		excludeExtraneousValues: true,
		exposeDefaultValues: true
	});

	const errors = validateSync(appConfig);
	if (errors.length > 0)
		throw new Error(`Invalid app env config: ${errors.toString()}`);

	return {
		nodeEnv: appConfig.NODE_ENV,
		port: appConfig.PORT
	};
});
