import { UnauthorizedException } from "@nestjs/common";

import { createErrorsFilter } from "../common/filters/create-errors-filter";

export class InvalidCredentialsError extends Error {
	constructor() {
		super("Invalid email or password");
		this.name = "InvalidCredentialsError";
	}
}

export const AuthErrorsFilter = createErrorsFilter([
	[InvalidCredentialsError, UnauthorizedException]
]);
