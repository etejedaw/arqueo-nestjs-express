import { QueryFailedError } from "typeorm";

import { parseConstraintViolation } from "../../src/database/postgres-errors";

function queryFailedError(driverFields: object): QueryFailedError {
	const driverError = Object.assign(new Error("query failed"), driverFields);
	return new QueryFailedError("INSERT INTO users", [], driverError);
}

describe("parseConstraintViolation", () => {
	it("returns the kind and the constraint details of a unique violation", () => {
		const error = queryFailedError({
			code: "23505",
			constraint: "uq_users_email",
			table: "users"
		});

		expect(parseConstraintViolation(error)).toEqual({
			kind: "unique_violation",
			constraint: "uq_users_email",
			table: "users",
			column: undefined
		});
	});

	it.each([
		["23503", "foreign_key_violation"],
		["23502", "not_null_violation"],
		["23514", "check_violation"]
	])("maps the code %s to %s", (code, kind) => {
		expect(parseConstraintViolation(queryFailedError({ code }))).toEqual(
			expect.objectContaining({ kind })
		);
	});

	it("returns null for a failed query that is not a constraint violation", () => {
		expect(
			parseConstraintViolation(queryFailedError({ code: "40P01" }))
		).toBeNull();
	});

	it("returns null for a failed query without a code", () => {
		expect(parseConstraintViolation(queryFailedError({}))).toBeNull();
	});

	it("returns null for an error that is not a failed query", () => {
		const error = Object.assign(new Error("duplicate"), { code: "23505" });

		expect(parseConstraintViolation(error)).toBeNull();
	});
});
