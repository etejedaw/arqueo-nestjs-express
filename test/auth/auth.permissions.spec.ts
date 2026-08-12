import {
	can,
	hasPermissions,
	ROLE_PERMISSIONS,
	roleOf
} from "../../src/auth/auth.permissions";

describe("auth permissions", () => {
	describe("roleOf", () => {
		it("returns admin for an admin", () => {
			expect(roleOf({ isAdmin: true })).toBe("admin");
		});

		it("returns user for a non admin", () => {
			expect(roleOf({ isAdmin: false })).toBe("user");
		});
	});

	describe("ROLE_PERMISSIONS", () => {
		it("lets a user read and update their profile only", () => {
			expect(ROLE_PERMISSIONS.user).toEqual([
				"profile:read",
				"profile:update"
			]);
		});

		it("gives an admin everything a user has plus managing users", () => {
			expect(ROLE_PERMISSIONS.admin).toEqual([
				...ROLE_PERMISSIONS.user,
				"users:manage"
			]);
		});
	});

	describe("hasPermissions", () => {
		it("allows when nothing is required", () => {
			expect(hasPermissions([], [])).toBe(true);
		});

		it("allows when the exact permission is granted", () => {
			expect(hasPermissions(["users:read"], ["users:read"])).toBe(true);
		});

		it("denies when the permission is not granted", () => {
			expect(hasPermissions(["users:read"], ["users:delete"])).toBe(
				false
			);
		});

		it("treats manage as every action on its resource", () => {
			expect(
				hasPermissions(
					["users:manage"],
					[
						"users:create",
						"users:read",
						"users:update",
						"users:delete"
					]
				)
			).toBe(true);
		});

		it("does not extend manage to other resources", () => {
			expect(hasPermissions(["users:manage"], ["profile:read"])).toBe(
				false
			);
		});

		it("requires every permission", () => {
			expect(
				hasPermissions(
					["profile:read"],
					["profile:read", "profile:update"]
				)
			).toBe(false);
		});
	});

	describe("can", () => {
		it("lets a user update their profile", () => {
			expect(can({ isAdmin: false }, ["profile:update"])).toBe(true);
		});

		it("does not let a user manage users", () => {
			expect(can({ isAdmin: false }, ["users:update"])).toBe(false);
		});

		it("lets an admin manage users and their own profile", () => {
			expect(
				can({ isAdmin: true }, ["users:delete", "profile:read"])
			).toBe(true);
		});
	});
});
