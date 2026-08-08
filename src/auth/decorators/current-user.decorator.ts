import { createParamDecorator, ExecutionContext } from "@nestjs/common";

import { AuthUser } from "../interfaces/auth-user.interface";
import { AuthenticatedRequest } from "../interfaces/authenticated-request.interface";

export const CurrentUser = createParamDecorator(
	(_data: unknown, context: ExecutionContext): AuthUser =>
		context.switchToHttp().getRequest<AuthenticatedRequest>().user
);
