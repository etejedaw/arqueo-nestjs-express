import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { EntityManager, Repository } from "typeorm";

import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { User } from "./entities/user.entity";
import {
	EmailAlreadyInUseError,
	LastAdminError,
	UserNotFoundError
} from "./users.errors";

@Injectable()
export class UsersService {
	private readonly writeLock = { mode: "pessimistic_write" } as const;

	constructor(
		@InjectRepository(User)
		private readonly usersRepository: Repository<User>
	) {}

	async create(createUserDto: CreateUserDto): Promise<User> {
		const existing = await this.usersRepository.findOne({
			where: { email: createUserDto.email },
			withDeleted: true
		});
		if (existing) throw new EmailAlreadyInUseError(createUserDto.email);

		const user = this.usersRepository.create(createUserDto);
		return await this.usersRepository.save(user);
	}

	async findAll(isActive: boolean): Promise<User[]> {
		return await this.usersRepository.find({ withDeleted: !isActive });
	}

	async findById(id: string, isActive: boolean): Promise<User> {
		const user = await this.usersRepository.findOne({
			where: { id },
			withDeleted: !isActive
		});
		if (!user) throw new UserNotFoundError(id);

		return user;
	}

	async findByEmail(email: string): Promise<User | null> {
		return await this.usersRepository.findOneBy({ email });
	}

	async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
		return await this.usersRepository.manager.transaction(async manager => {
			const activeAdmins = await this.lockActiveAdmins(manager);
			const user = await this.lockUser(manager, id, false);
			if (updateUserDto.isAdmin === false)
				this.assertAnotherAdminRemains(activeAdmins, user);

			manager.merge(User, user, updateUserDto);
			await manager.save(user);

			return await this.lockUser(manager, id, false);
		});
	}

	async updatePassword(id: string, password: string): Promise<void> {
		await this.findById(id, true);
		await this.usersRepository.update(id, { password });
	}

	async remove(id: string): Promise<boolean> {
		return await this.usersRepository.manager.transaction(async manager => {
			const activeAdmins = await this.lockActiveAdmins(manager);
			const user = await this.lockUser(manager, id, true);
			if (user.deletedAt) return false;

			this.assertAnotherAdminRemains(activeAdmins, user);
			await manager.softDelete(User, id);

			return true;
		});
	}

	async reactivate(id: string): Promise<void> {
		const user = await this.usersRepository.findOne({
			where: { id },
			withDeleted: true
		});
		if (!user) throw new UserNotFoundError(id);
		if (!user.deletedAt) return;

		await this.usersRepository.restore(id);
	}

	async delete(id: string): Promise<boolean> {
		return await this.usersRepository.manager.transaction(async manager => {
			const activeAdmins = await this.lockActiveAdmins(manager);
			const user = await this.lockUser(manager, id, true);

			this.assertAnotherAdminRemains(activeAdmins, user);
			const result = await manager.delete(User, id);

			return (result.affected ?? 0) > 0;
		});
	}

	private async lockActiveAdmins(manager: EntityManager): Promise<User[]> {
		return await manager.find(User, {
			where: { isAdmin: true },
			order: { id: "ASC" },
			lock: this.writeLock
		});
	}

	private async lockUser(
		manager: EntityManager,
		id: string,
		withDeleted: boolean
	): Promise<User> {
		const user = await manager.findOne(User, {
			where: { id },
			withDeleted,
			lock: this.writeLock
		});
		if (!user) throw new UserNotFoundError(id);

		return user;
	}

	private assertAnotherAdminRemains(activeAdmins: User[], user: User): void {
		const isActiveAdmin = activeAdmins.some(admin => admin.id === user.id);
		if (isActiveAdmin && activeAdmins.length === 1)
			throw new LastAdminError(user.id);
	}
}
