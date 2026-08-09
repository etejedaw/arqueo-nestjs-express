import { Expose } from "class-transformer";

export class UserResponse {
	@Expose() readonly id: string;
	@Expose() readonly name: string;
	@Expose() readonly email: string;
}
