import { registerAs } from "@nestjs/config";
import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { Expose, plainToInstance, Type } from "class-transformer";
import {
	IsInt,
	IsNotEmpty,
	IsPositive,
	IsString,
	validateSync
} from "class-validator";

class DatabaseConfig {
	@Expose()
	@IsString()
	@IsNotEmpty()
	DB_HOST = "localhost";

	@Expose()
	@IsInt()
	@IsPositive()
	@Type(() => Number)
	DB_PORT = 5432;

	@Expose()
	@IsString()
	@IsNotEmpty()
	DB_USERNAME = "root";

	@Expose()
	@IsString()
	@IsNotEmpty()
	DB_PASSWORD = "toor";

	@Expose()
	@IsString()
	@IsNotEmpty()
	DB_DATABASE = "arqueo";
}

export default registerAs("database", (): TypeOrmModuleOptions => {
	const databaseConfig = plainToInstance(DatabaseConfig, process.env, {
		excludeExtraneousValues: true,
		exposeDefaultValues: true
	});

	const errors = validateSync(databaseConfig);
	if (errors.length > 0) throw new Error(`Invalid database env config`);

	return {
		type: "postgres",
		host: databaseConfig.DB_HOST,
		port: databaseConfig.DB_PORT,
		username: databaseConfig.DB_USERNAME,
		password: databaseConfig.DB_PASSWORD,
		database: databaseConfig.DB_DATABASE
	};
});
