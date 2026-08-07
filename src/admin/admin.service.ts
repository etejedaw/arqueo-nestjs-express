import { Injectable } from "@nestjs/common";

import { HashingService } from "../auth/hashing.service";
import { User } from "../users/entities/user.entity";
import { UsersService } from "../users/users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { GeneratePasswordService } from "./generate-password.service";

export interface CreatedUser {
	user: User;
	password: string;
}

@Injectable()
export class AdminService {
	constructor(
		private readonly usersService: UsersService,
		private readonly generatePasswordService: GeneratePasswordService,
		private readonly hashingService: HashingService
	) {}

	async create(createUserDto: CreateUserDto): Promise<CreatedUser> {
		const password = this.generatePasswordService.generatePassword();
		const hashPassword = await this.hashingService.hash(password);

		const userDto = {
			name: createUserDto.name,
			email: createUserDto.email,
			password: hashPassword,
			isAdmin: createUserDto.isAdmin
		};

		const user = await this.usersService.create(userDto);

		return { user, password };
	}

	async resetPassword(id: string): Promise<string> {
		const password = this.generatePasswordService.generatePassword();
		const hashPassword = await this.hashingService.hash(password);

		await this.usersService.updatePassword(id, hashPassword);

		return password;
	}
}
