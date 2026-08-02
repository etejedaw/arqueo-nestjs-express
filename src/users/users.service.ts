import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { User } from "./entities/user.entity";

@Injectable()
export class UsersService {
	constructor(
		@InjectRepository(User)
		private readonly usersRepository: Repository<User>
	) {}

	create(createUserDto: CreateUserDto) {
		return `This action adds a new user ${createUserDto.name}`;
	}

	findAll() {
		return `This action returns all users`;
	}

	async findOne(id: string) {
		const user = await this.usersRepository.findOneBy({
			id,
			isActive: true
		});
		if (!user) throw new NotFoundException(`User ${id} not found`);

		return user;
	}

	update(id: string, updateUserDto: UpdateUserDto) {
		return `This action updates a #${id} user ${updateUserDto.name}`;
	}

	remove(id: string) {
		return `This action removes a #${id} user`;
	}
}
