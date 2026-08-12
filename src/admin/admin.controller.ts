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

import { Auth } from "../auth/decorators/auth.decorator";
import { Serialize } from "../common/decorators/serialize.decorator";
import { User } from "../users/entities/user.entity";
import { AdminService } from "./admin.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { CreatedUserResponse } from "./responses/created-user.response";
import { UserResponse } from "./responses/user.response";

@Auth()
@Controller("admin/users")
export class AdminController {
	constructor(private readonly adminService: AdminService) {}

	@Serialize(CreatedUserResponse)
	@Post()
	async create(
		@Body() createUserDto: CreateUserDto
	): Promise<CreatedUserResponse> {
		const { user, password } =
			await this.adminService.create(createUserDto);

		return {
			id: user.id,
			name: user.name,
			email: user.email,
			isAdmin: user.isAdmin,
			password
		};
	}

	@Serialize(UserResponse)
	@Get()
	async findAll(): Promise<User[]> {
		return await this.adminService.findAllUsers();
	}

	@Serialize(UserResponse)
	@Get(":id")
	async findUser(@Param("id", ParseUUIDPipe) id: string): Promise<User> {
		return await this.adminService.findUser(id);
	}

	@Serialize(UserResponse)
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

	@HttpCode(HttpStatus.NO_CONTENT)
	@Patch(":id/deactivate")
	async deactivateUser(
		@Param("id", ParseUUIDPipe) id: string
	): Promise<void> {
		await this.adminService.deactivateUser(id);
	}

	@HttpCode(HttpStatus.NO_CONTENT)
	@Patch(":id/reactivate")
	async activateUser(@Param("id", ParseUUIDPipe) id: string): Promise<void> {
		await this.adminService.activateUser(id);
	}

	@HttpCode(HttpStatus.NO_CONTENT)
	@Delete(":id")
	async deleteUser(@Param("id", ParseUUIDPipe) id: string): Promise<void> {
		await this.adminService.deleteUser(id);
	}
}
