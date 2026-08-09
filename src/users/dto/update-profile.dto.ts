import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class UpdateProfileDto {
	@IsOptional() @IsString() @IsNotEmpty() readonly name?: string;
}
