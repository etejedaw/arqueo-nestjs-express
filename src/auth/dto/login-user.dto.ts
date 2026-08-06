import { IsEmail, IsNotEmpty, IsString } from "class-validator";

import { ToLowerCase } from "../../common/decorators/to-lower-case.decorator";
import { Trim } from "../../common/decorators/trim.decorator";

export class LoginUserDto {
	@Trim()
	@ToLowerCase()
	@IsEmail()
	readonly email: string;

	@IsString()
	@IsNotEmpty()
	readonly password: string;
}
