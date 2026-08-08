import { ExecutionContext } from "@nestjs/common";
import { ROUTE_ARGS_METADATA } from "@nestjs/common/constants";

import { CurrentUser } from "../../../src/auth/decorators/current-user.decorator";
import type { AuthUser } from "../../../src/auth/interfaces/auth-user.interface";

type ParamFactory = (data: unknown, context: ExecutionContext) => unknown;

class Fixture {
	handler(@CurrentUser() _user: AuthUser): void {
		return;
	}
}

function currentUserFactory(): ParamFactory {
	const args = Reflect.getMetadata(
		ROUTE_ARGS_METADATA,
		Fixture,
		"handler"
	) as Record<string, { factory: ParamFactory }>;

	return Object.values(args)[0].factory;
}

function buildContext(request: object): ExecutionContext {
	return {
		switchToHttp: () => ({ getRequest: () => request })
	} as unknown as ExecutionContext;
}

describe("CurrentUser", () => {
	it("returns the user the guard attached to the request", () => {
		const user: AuthUser = {
			id: "3f1c2a9e-6b1d-4c3e-9a7f-2d5e8b0c4a11",
			name: "Ada Lovelace",
			email: "ada@arqueo.local",
			isAdmin: false
		};

		expect(currentUserFactory()(undefined, buildContext({ user }))).toBe(
			user
		);
	});
});
