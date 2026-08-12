import { applyDecorators, SetMetadata, UseGuards } from "@nestjs/common";

import { PERMISSIONS_KEY } from "../auth.permissions";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import { PermissionsGuard } from "../guards/permissions.guard";
import { Permission } from "../types/permission.type";

export function Auth(
	...permissions: Permission[]
): ClassDecorator & MethodDecorator {
	return applyDecorators(
		SetMetadata(PERMISSIONS_KEY, permissions),
		UseGuards(JwtAuthGuard, PermissionsGuard)
	);
}
