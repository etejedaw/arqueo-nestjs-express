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

	async create(createUserDto: CreateUserDto): Promise<User> {
		const user = this.usersRepository.create(createUserDto);
		return this.findById(user.id);
	}

	async findAll(): Promise<User[]> {
		return await this.usersRepository.find({
			where: { isActive: true }
		});
	}

	async findById(id: string): Promise<User> {
		const user = await this.usersRepository.findOneBy({
			id,
			isActive: true
		});
		if (!user) throw new NotFoundException(`User ${id} not found`);

		return user;
	}

	async findByEmail(email: string): Promise<User | null> {
		return await this.usersRepository.findOneBy({ email, isActive: true });
	}

	async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
		const user = await this.findById(id);
		this.usersRepository.merge(user, updateUserDto);
		await this.usersRepository.save(user);

		return this.findById(id);
	}

	async remove(id: string): Promise<void> {
		await this.usersRepository.update(id, { isActive: false });
	}

	async reactivate(id: string): Promise<void> {
		await this.usersRepository.update(id, { isActive: true });
	}

	async delete(id: string): Promise<void> {
		await this.usersRepository.delete(id);
	}
}
