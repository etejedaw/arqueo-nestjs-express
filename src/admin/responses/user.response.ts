import { Expose } from "class-transformer";

export class UserResponse {
	@Expose() readonly id: string;
	@Expose() readonly name: string;
	@Expose() readonly email: string;
	@Expose() readonly isAdmin: boolean;
	@Expose() readonly createdAt: Date;
	@Expose() readonly updatedAt: Date;
	@Expose() readonly deletedAt: Date | null;
}
