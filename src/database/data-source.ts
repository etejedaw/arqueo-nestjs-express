import { DataSource, DataSourceOptions } from "typeorm";

import databaseConfig from "../config/database.config";

export default new DataSource({
	...(databaseConfig() as DataSourceOptions),
	migrationsRun: false
});
