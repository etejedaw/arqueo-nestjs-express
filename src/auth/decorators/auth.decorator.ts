import { applyDecorators, UseGuards } from "@nestjs/common";

import { JwtAuthGuard } from "../guards/jwt-auth.guard";

export function Auth(): ClassDecorator & MethodDecorator {
	return applyDecorators(UseGuards(JwtAuthGuard));
}
