import { Expose } from "class-transformer";

export class LoginResponse {
	@Expose() readonly accessToken: string;
}
