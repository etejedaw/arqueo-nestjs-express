import {
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Post
} from "@nestjs/common";

import { Serialize } from "../common/decorators/serialize.decorator";
import { AuthService } from "./auth.service";
import { Auth } from "./decorators/auth.decorator";
import { CurrentUser } from "./decorators/current-user.decorator";
import { LoginUserDto } from "./dto/login-user.dto";
import type { AuthUser } from "./interfaces/auth-user.interface";
import { LoginResponse } from "./responses/login.response";
import { UserResponse } from "./responses/user.response";

@Controller("auth")
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Serialize(LoginResponse)
	@HttpCode(HttpStatus.OK)
	@Post("login")
	async login(@Body() loginUserDto: LoginUserDto): Promise<LoginResponse> {
		return await this.authService.login(loginUserDto);
	}

	@Serialize(UserResponse)
	@Auth()
	@Get("me")
	getMe(@CurrentUser() user: AuthUser): AuthUser {
		return user;
	}
}
