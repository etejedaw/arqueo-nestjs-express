import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { EntityManager, Repository } from "typeorm";

import { parseConstraintViolation } from "../database/postgres-errors";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { User } from "./entities/user.entity";
import {
	EmailAlreadyInUseError,
	LastAdminError,
	UserNotFoundError
} from "./users.errors";

const WRITE_LOCK = { mode: "pessimistic_write" } as const;

@Injectable()
export class UsersService {
	constructor(
		@InjectRepository(User)
		private readonly usersRepository: Repository<User>
	) {}

	async create(createUserDto: CreateUserDto): Promise<User> {
		const user = this.usersRepository.create(createUserDto);
		try {
			return await this.usersRepository.save(user);
		} catch (error) {
			const violation = parseConstraintViolation(error);
			if (violation?.constraint === "uq_users_email")
				throw new EmailAlreadyInUseError(createUserDto.email);
			throw error;
		}
	}

	async findAll(): Promise<User[]> {
		return await this.usersRepository.find();
	}

	async findById(id: string): Promise<User> {
		const user = await this.usersRepository.findOneBy({ id });
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

	async remove(id: string): Promise<void> {
		await this.usersRepository.manager.transaction(async manager => {
			const activeAdmins = await this.lockActiveAdmins(manager);
			const user = await this.lockUser(manager, id, true);
			if (user.deletedAt) return;

			this.assertAnotherAdminRemains(activeAdmins, user);
			await manager.softDelete(User, id);
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

	async delete(id: string): Promise<void> {
		await this.usersRepository.manager.transaction(async manager => {
			const activeAdmins = await this.lockActiveAdmins(manager);
			const user = await this.lockUser(manager, id, true);

			this.assertAnotherAdminRemains(activeAdmins, user);
			await manager.delete(User, id);
		});
	}

	private async lockActiveAdmins(manager: EntityManager): Promise<User[]> {
		return await manager.find(User, {
			where: { isAdmin: true },
			order: { id: "ASC" },
			lock: WRITE_LOCK
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
			lock: WRITE_LOCK
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
