import {
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Patch
} from "@nestjs/common";

import { Auth } from "../auth/decorators/auth.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { AuthUser } from "../auth/interfaces/auth-user.interface";
import { Serialize } from "../common/decorators/serialize.decorator";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { User } from "./entities/user.entity";
import { UserResponse } from "./responses/user.response";
import { UsersService } from "./users.service";

@Controller("users")
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	@Auth("profile:read")
	@Serialize(UserResponse)
	@Get("me")
	getMe(@CurrentUser() user: AuthUser): AuthUser {
		return user;
	}

	@Auth("profile:update")
	@Serialize(UserResponse)
	@Patch("me")
	async updateMe(
		@CurrentUser() user: AuthUser,
		@Body() updateProfileDto: UpdateProfileDto
	): Promise<User> {
		return await this.usersService.update(user.id, updateProfileDto);
	}

	@Auth()
	@HttpCode(HttpStatus.NO_CONTENT)
	@Patch("me/password")
	async changePassword(
		@CurrentUser() user: AuthUser,
		@Body() changePasswordDto: ChangePasswordDto
	): Promise<void> {
		await this.usersService.changePassword(user.id, changePasswordDto);
	}
}
