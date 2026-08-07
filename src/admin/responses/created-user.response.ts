import { OmitType } from "@nestjs/mapped-types";
import { Expose } from "class-transformer";

import { UserResponse } from "./user.response";

export class CreatedUserResponse extends OmitType(UserResponse, [
	"createdAt",
	"updatedAt",
	"deletedAt"
] as const) {
	@Expose() readonly password: string;
}
