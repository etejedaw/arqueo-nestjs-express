import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

import { HashingService } from "../common/hashing/hashing.service";
import { UsersService } from "../users/users.service";
import { InvalidCredentialsError } from "./auth.errors";
import { LoginUserDto } from "./dto/login-user.dto";
import { AuthTokens } from "./interfaces/auth-tokens.interface";
import { JwtPayload } from "./interfaces/jwt-payload.interface";

@Injectable()
export class AuthService {
	constructor(
		private readonly usersService: UsersService,
		private readonly hashingService: HashingService,
		private readonly jwtService: JwtService
	) {}

	async login(loginUserDto: LoginUserDto): Promise<AuthTokens> {
		const user = await this.usersService.findByEmail(loginUserDto.email);
		if (!user) throw new InvalidCredentialsError();

		const matchPassword = await this.hashingService.verify(
			loginUserDto.password,
			user.password
		);
		if (!matchPassword) throw new InvalidCredentialsError();

		const payload: JwtPayload = { sub: user.id };
		const accessToken = await this.jwtService.signAsync(payload);

		return { accessToken };
	}
}
