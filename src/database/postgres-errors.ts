import { QueryFailedError } from "typeorm";

export type ConstraintViolationKind =
	| "unique_violation"
	| "foreign_key_violation"
	| "not_null_violation"
	| "check_violation";

export interface ConstraintViolation {
	kind: ConstraintViolationKind;
	constraint?: string;
	table?: string;
	column?: string;
}

const KIND_BY_CODE: Record<string, ConstraintViolationKind> = {
	"23505": "unique_violation",
	"23503": "foreign_key_violation",
	"23502": "not_null_violation",
	"23514": "check_violation"
};

interface PostgresDriverError {
	code?: string;
	constraint?: string;
	table?: string;
	column?: string;
}

export function parseConstraintViolation(
	error: unknown
): ConstraintViolation | null {
	if (!(error instanceof QueryFailedError)) return null;

	const { code, constraint, table, column } =
		error.driverError as PostgresDriverError;
	const kind = code ? KIND_BY_CODE[code] : undefined;
	if (!kind) return null;

	return { kind, constraint, table, column };
}
