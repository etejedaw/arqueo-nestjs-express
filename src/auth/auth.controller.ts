import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";

import { Serialize } from "../common/decorators/serialize.decorator";
import { User } from "../users/entities/user.entity";
import { AuthService } from "./auth.service";
import { LoginUserDto } from "./dto/login-user.dto";
import { UserResponse } from "./responses/user.response";

@Controller("auth")
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Serialize(UserResponse)
	@HttpCode(HttpStatus.OK)
	@Post("login")
	async login(@Body() loginUserDto: LoginUserDto): Promise<User> {
		return await this.authService.login(loginUserDto);
	}
}
