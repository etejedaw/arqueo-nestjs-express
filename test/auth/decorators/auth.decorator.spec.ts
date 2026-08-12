import { GUARDS_METADATA } from "@nestjs/common/constants";

import { PERMISSIONS_KEY } from "../../../src/auth/auth.permissions";
import { Auth } from "../../../src/auth/decorators/auth.decorator";
import { JwtAuthGuard } from "../../../src/auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../../src/auth/guards/permissions.guard";

class GuardedHandler {
	@Auth("users:read")
	handler(): void {
		return;
	}
}

@Auth()
class GuardedController {}

function handlerOf(target: object): object {
	return Object.getOwnPropertyDescriptor(target, "handler")?.value as object;
}

describe("Auth", () => {
	it("guards a handler with the jwt and permissions guards, in that order", () => {
		const handler = handlerOf(GuardedHandler.prototype);

		expect(Reflect.getMetadata(GUARDS_METADATA, handler)).toEqual([
			JwtAuthGuard,
			PermissionsGuard
		]);
	});

	it("stores the required permissions", () => {
		const handler = handlerOf(GuardedHandler.prototype);

		expect(Reflect.getMetadata(PERMISSIONS_KEY, handler)).toEqual([
			"users:read"
		]);
	});

	it("requires no permission when none is given", () => {
		expect(Reflect.getMetadata(PERMISSIONS_KEY, GuardedController)).toEqual(
			[]
		);
	});
});
