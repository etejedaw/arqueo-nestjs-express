import { GUARDS_METADATA } from "@nestjs/common/constants";

import { Auth } from "../../../src/auth/decorators/auth.decorator";
import { JwtAuthGuard } from "../../../src/auth/guards/jwt-auth.guard";

class GuardedHandler {
	@Auth()
	handler(): void {
		return;
	}
}

@Auth()
class GuardedController {}

function guardsOf(target: object): unknown {
	return Reflect.getMetadata(GUARDS_METADATA, target);
}

describe("Auth", () => {
	it("guards a handler with the jwt guard", () => {
		const handler = Object.getOwnPropertyDescriptor(
			GuardedHandler.prototype,
			"handler"
		)?.value as object;

		expect(guardsOf(handler)).toEqual([JwtAuthGuard]);
	});

	it("guards every handler of a controller with the jwt guard", () => {
		expect(guardsOf(GuardedController)).toEqual([JwtAuthGuard]);
	});
});
