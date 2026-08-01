import { registerAs } from "@nestjs/config";
import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { plainToInstance, Type } from "class-transformer";
import { IsInt, IsNotEmpty, IsString, validateSync } from "class-validator";

class DatabaseConfig {
	@IsString()
	@IsNotEmpty()
	DB_HOST = "localhost";

	@IsInt()
	@IsNotEmpty()
	@Type(() => Number)
	DB_PORT = 5432;

	@IsString()
	@IsNotEmpty()
	DB_USERNAME = "root";

	@IsString()
	@IsNotEmpty()
	DB_PASSWORD = "toor";

	@IsString()
	@IsNotEmpty()
	DB_DATABASE = "arqueo";
}

export default registerAs("database", (): TypeOrmModuleOptions => {
	const databaseConfig = plainToInstance(DatabaseConfig, process.env, {
		excludeExtraneousValues: true
	});

	const errors = validateSync(databaseConfig);
	if (errors.length > 0) throw new Error(`Invalid database config`);

	return {
		type: "postgres",
		host: databaseConfig.DB_HOST,
		port: databaseConfig.DB_PORT,
		username: databaseConfig.DB_USERNAME,
		password: databaseConfig.DB_PASSWORD,
		database: databaseConfig.DB_DATABASE
	};
});
