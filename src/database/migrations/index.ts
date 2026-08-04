import { MigrationInterface } from "typeorm";

import { CreateUsersTable1789444724360 } from "./1789444724360-CreateUsersTable";

export const migrations: (new () => MigrationInterface)[] = [
	CreateUsersTable1789444724360
];
