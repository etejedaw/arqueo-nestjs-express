import { registerAs } from "@nestjs/config";
import { JwtModuleOptions } from "@nestjs/jwt";
import { Expose, plainToInstance } from "class-transformer";
import { IsNotEmpty, IsString, Matches, validateSync } from "class-validator";

type ExpiresIn = NonNullable<JwtModuleOptions["signOptions"]>["expiresIn"];

const EXPIRES_IN = /^\d+(?:ms|s|m|h|d|w|y)?$/;

class AuthConfig {
	@Expose()
	@IsString()
	@IsNotEmpty()
	JWT_ACCESS_SECRET = "arqueo-dev-access-secret";

	@Expose()
	@Matches(EXPIRES_IN)
	JWT_ACCESS_EXPIRES_IN = "1d";
}

export default registerAs("auth", (): JwtModuleOptions => {
	const authConfig = plainToInstance(AuthConfig, process.env, {
		excludeExtraneousValues: true,
		exposeDefaultValues: true
	});

	const errors = validateSync(authConfig);
	if (errors.length > 0)
		throw new Error(`Invalid auth env config: ${errors.toString()}`);

	return {
		secret: authConfig.JWT_ACCESS_SECRET,
		signOptions: {
			expiresIn: authConfig.JWT_ACCESS_EXPIRES_IN as ExpiresIn
		}
	};
});
