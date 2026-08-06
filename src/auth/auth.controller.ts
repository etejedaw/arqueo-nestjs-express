import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";

import { User } from "../users/entities/user.entity";
import { AuthService } from "./auth.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { LoginUserDto } from "./dto/login-user.dto";

@Controller("auth")
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@HttpCode(HttpStatus.OK)
	@Post("login")
	async login(@Body() loginUserDto: LoginUserDto): Promise<User> {
		return await this.authService.login(loginUserDto);
	}

	@Post("register")
	async register(@Body() createUserDto: CreateUserDto): Promise<User> {
		return await this.authService.register(createUserDto);
	}
}
