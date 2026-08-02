import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class CreateUserDto {
	@IsString() @IsNotEmpty() declare name: string;
	@IsEmail() declare email: string;
	@IsString() declare password: string;
}
