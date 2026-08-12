import {
	CanActivate,
	ExecutionContext,
	ForbiddenException,
	Injectable
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import { can, PERMISSIONS_KEY } from "../auth.permissions";
import { AuthenticatedRequest } from "../interfaces/authenticated-request.interface";
import { Permission } from "../types/permission.type";

@Injectable()
export class PermissionsGuard implements CanActivate {
	constructor(private readonly reflector: Reflector) {}

	canActivate(context: ExecutionContext): boolean {
		const required =
			this.reflector.getAllAndOverride<Permission[] | undefined>(
				PERMISSIONS_KEY,
				[context.getHandler(), context.getClass()]
			) ?? [];

		const { user } = context
			.switchToHttp()
			.getRequest<AuthenticatedRequest>();
		if (!can(user, required)) throw new ForbiddenException();

		return true;
	}
}
