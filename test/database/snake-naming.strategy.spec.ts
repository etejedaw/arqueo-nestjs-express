import { Table } from "typeorm";

import { SnakeNamingStrategy } from "../../src/database/snake-naming.strategy";

describe("SnakeNamingStrategy", () => {
	const strategy = new SnakeNamingStrategy();

	describe("constraint names", () => {
		it("names the primary key after the table", () => {
			expect(strategy.primaryKeyName("users")).toBe("pk_users");
		});

		it("names a unique constraint after the table and its columns", () => {
			expect(strategy.uniqueConstraintName("users", ["email"])).toBe(
				"uq_users_email"
			);
		});

		it("keeps the declared column order", () => {
			expect(
				strategy.uniqueConstraintName("contacts", [
					"owner_user_id",
					"email"
				])
			).toBe("uq_contacts_owner_user_id_email");
		});

		it("names a relation unique constraint like any unique constraint", () => {
			expect(
				strategy.relationConstraintName("profiles", ["user_id"])
			).toBe("uq_profiles_user_id");
		});

		it("names a foreign key after the table and its columns", () => {
			expect(strategy.foreignKeyName("transactions", ["period_id"])).toBe(
				"fk_transactions_period_id"
			);
		});

		it("names an index after the table and its columns", () => {
			expect(strategy.indexName("transactions", ["user_id"])).toBe(
				"idx_transactions_user_id"
			);
		});

		it("drops the schema when it receives a Table", () => {
			const table = new Table({ name: "public.users" });

			expect(strategy.uniqueConstraintName(table, ["email"])).toBe(
				"uq_users_email"
			);
		});

		it("throws when the name exceeds the Postgres identifier limit", () => {
			const columns = ["a_very_long_column_name", "another_long_column"];

			expect(() =>
				strategy.uniqueConstraintName("a_long_table_name", columns)
			).toThrow(/exceeds 63 characters/);
		});
	});
});
