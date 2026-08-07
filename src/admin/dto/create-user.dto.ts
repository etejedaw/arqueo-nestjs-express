import { IsBoolean, IsEmail, IsNotEmpty, IsString } from "class-validator";

import { ToLowerCase } from "../../common/decorators/to-lower-case.decorator";
import { Trim } from "../../common/decorators/trim.decorator";

export class CreateUserDto {
	@IsString() @IsNotEmpty() readonly name: string;
	@Trim() @ToLowerCase() @IsEmail() readonly email: string;
	@IsBoolean() readonly isAdmin: boolean = false;
}
