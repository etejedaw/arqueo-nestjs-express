import { DataSource } from "typeorm";

import { SnakeNamingStrategy } from "../../../src/database/snake-naming.strategy";
import { User } from "../../../src/users/entities/user.entity";

interface MetadataBuilder {
	buildMetadatas(): Promise<void>;
}

describe("User entity", () => {
	let dataSource: DataSource;

	beforeAll(async () => {
		dataSource = new DataSource({
			type: "postgres",
			entities: [User],
			namingStrategy: new SnakeNamingStrategy()
		});
		await (dataSource as unknown as MetadataBuilder).buildMetadatas();
	});

	it("names the email unique constraint as UsersService expects", () => {
		const uniques = dataSource.getMetadata(User).uniques.map(unique => ({
			name: unique.name,
			columns: unique.columns.map(column => column.databaseName)
		}));

		expect(uniques).toEqual([
			{ name: "uq_users_email", columns: ["email"] }
		]);
	});
});
