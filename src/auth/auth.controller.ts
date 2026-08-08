import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";

import { Serialize } from "../common/decorators/serialize.decorator";
import { AuthService } from "./auth.service";
import { LoginUserDto } from "./dto/login-user.dto";
import { LoginResponse } from "./responses/login.response";

@Controller("auth")
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Serialize(LoginResponse)
	@HttpCode(HttpStatus.OK)
	@Post("login")
	async login(@Body() loginUserDto: LoginUserDto): Promise<LoginResponse> {
		return await this.authService.login(loginUserDto);
	}
}
