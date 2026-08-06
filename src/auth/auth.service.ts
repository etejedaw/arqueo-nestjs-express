import { Injectable } from "@nestjs/common";

import { User } from "../users/entities/user.entity";
import { UsersService } from "../users/users.service";
import { InvalidCredentialsError } from "./auth.errors";
import { CreateUserDto } from "./dto/create-user.dto";
import { LoginUserDto } from "./dto/login-user.dto";
import { HashingService } from "./hashing.service";

@Injectable()
export class AuthService {
	constructor(
		private readonly usersService: UsersService,
		private readonly hashingService: HashingService
	) {}

	async login(loginUserDto: LoginUserDto): Promise<User> {
		const user = await this.usersService.findByEmail(loginUserDto.email);
		if (!user) throw new InvalidCredentialsError();

		const matchPassword = await this.hashingService.verify(
			loginUserDto.password,
			user.password
		);
		if (!matchPassword) throw new InvalidCredentialsError();

		return user;
	}

	async register(createUserDto: CreateUserDto) {
		const hashPassword = await this.hashingService.hash(
			createUserDto.password
		);

		const userDto = {
			name: createUserDto.name,
			email: createUserDto.email,
			password: hashPassword,
			isAdmin: createUserDto.isAdmin
		};

		const user = await this.usersService.create(userDto);

		return user;
	}
}
