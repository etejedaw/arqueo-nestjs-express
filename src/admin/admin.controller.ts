import { Body, Controller, Post } from "@nestjs/common";

import { AdminService, CreatedUser } from "./admin.service";
import { CreateUserDto } from "./dto/create-user.dto";

@Controller("admin/users")
export class AdminController {
	constructor(private readonly adminService: AdminService) {}

	@Post()
	async create(@Body() createUserDto: CreateUserDto): Promise<CreatedUser> {
		return await this.adminService.create(createUserDto);
	}
}
