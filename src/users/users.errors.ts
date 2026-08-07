import { ConflictException, NotFoundException } from "@nestjs/common";

import { createErrorsFilter } from "../common/filters/create-errors-filter";

export class UserNotFoundError extends Error {
	constructor(readonly userId: string) {
		super(`User ${userId} not found`);
		this.name = "UserNotFoundError";
	}
}

export class EmailAlreadyInUseError extends Error {
	constructor(readonly email: string) {
		super(`Email ${email} is already in use`);
		this.name = "EmailAlreadyInUseError";
	}
}

export class LastAdminError extends Error {
	constructor(readonly userId: string) {
		super(`User ${userId} is the last active admin`);
		this.name = "LastAdminError";
	}
}

export const UsersErrorsFilter = createErrorsFilter([
	[UserNotFoundError, NotFoundException],
	[EmailAlreadyInUseError, ConflictException],
	[LastAdminError, ConflictException]
]);
