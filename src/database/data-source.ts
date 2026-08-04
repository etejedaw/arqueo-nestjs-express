import { join } from "node:path";

import { DataSource, DataSourceOptions } from "typeorm";

import databaseConfig from "../common/config/database.config";

export default new DataSource({
	...(databaseConfig() as DataSourceOptions),
	entities: [join(__dirname, "..", "**", "*.entity{.ts,.js}")],
	migrationsRun: false
});
