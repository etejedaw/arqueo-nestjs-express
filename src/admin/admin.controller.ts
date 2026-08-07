import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	ParseUUIDPipe,
	Patch,
	Post
} from "@nestjs/common";

import { User } from "../users/entities/user.entity";
import { AdminService, CreatedUser } from "./admin.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";

@Controller("admin/users")
export class AdminController {
	constructor(private readonly adminService: AdminService) {}

	@Post()
	async create(@Body() createUserDto: CreateUserDto): Promise<CreatedUser> {
		return await this.adminService.create(createUserDto);
	}

	@Get()
	async findAll(): Promise<User[]> {
		return await this.adminService.findAllUsers();
	}

	@Get(":id")
	async findUser(@Param("id", ParseUUIDPipe) id: string): Promise<User> {
		return await this.adminService.findUser(id);
	}

	@Patch(":id")
	async updateUser(
		@Param("id", ParseUUIDPipe) id: string,
		@Body() updateUserDto: UpdateUserDto
	): Promise<User> {
		return await this.adminService.updateUser(id, updateUserDto);
	}

	@HttpCode(HttpStatus.OK)
	@Post(":id/reset-password")
	async resetPassword(
		@Param("id", ParseUUIDPipe) id: string
	): Promise<{ password: string }> {
		const password = await this.adminService.resetPassword(id);
		return { password };
	}

	@Patch(":id/deactivate")
	async deactivateUser(
		@Param("id", ParseUUIDPipe) id: string
	): Promise<{ deactivated: boolean }> {
		const deactivated = await this.adminService.deactivateUser(id);
		return { deactivated };
	}

	@HttpCode(HttpStatus.NO_CONTENT)
	@Patch(":id/reactivate")
	async activateUser(@Param("id", ParseUUIDPipe) id: string): Promise<void> {
		await this.adminService.activateUser(id);
	}

	@Delete(":id")
	async deleteUser(
		@Param("id", ParseUUIDPipe) id: string
	): Promise<{ deleted: boolean }> {
		const deleted = await this.adminService.deleteUser(id);
		return { deleted };
	}
}
