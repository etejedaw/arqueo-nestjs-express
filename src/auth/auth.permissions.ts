import { AuthUser } from "./interfaces/auth-user.interface";
import { Permission, Resource } from "./types/permission.type";
import { Role } from "./types/role.type";

export const PERMISSIONS_KEY = "permissions";

const USER_PERMISSIONS: readonly Permission[] = [
	"profile:read",
	"profile:update"
];

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
	user: USER_PERMISSIONS,
	admin: [...USER_PERMISSIONS, "users:manage"]
};

export function roleOf(user: Pick<AuthUser, "isAdmin">): Role {
	return user.isAdmin ? "admin" : "user";
}

export function hasPermissions(
	granted: readonly Permission[],
	required: readonly Permission[]
): boolean {
	return required.every(permission => {
		const [resource] = permission.split(":") as [Resource];
		return (
			granted.includes(permission) ||
			granted.includes(`${resource}:manage`)
		);
	});
}

export function can(
	user: Pick<AuthUser, "isAdmin">,
	required: readonly Permission[]
): boolean {
	return hasPermissions(ROLE_PERMISSIONS[roleOf(user)], required);
}
