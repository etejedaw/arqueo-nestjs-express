import authConfig from "../../../src/common/config/auth.config";

const DEFAULT_ACCESS_SECRET = "arqueo-dev-access-secret";

describe("authConfig", () => {
	const originalEnv = process.env;

	beforeEach(() => {
		process.env = {};
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	it("falls back to the development secret and a one day access token", () => {
		expect(authConfig()).toEqual({
			secret: DEFAULT_ACCESS_SECRET,
			signOptions: { expiresIn: "1d" }
		});
	});

	it("takes the secret and the expiration from the environment", () => {
		process.env.JWT_ACCESS_SECRET = "a real secret";
		process.env.JWT_ACCESS_EXPIRES_IN = "2h";

		expect(authConfig()).toEqual({
			secret: "a real secret",
			signOptions: { expiresIn: "2h" }
		});
	});

	it("accepts an expiration in plain seconds", () => {
		process.env.JWT_ACCESS_EXPIRES_IN = "900";

		expect(authConfig().signOptions?.expiresIn).toBe("900");
	});

	it("throws when the expiration is not a duration", () => {
		process.env.JWT_ACCESS_EXPIRES_IN = "quince minutos";

		expect(() => authConfig()).toThrow("Invalid auth env config");
	});

	it("throws when the expiration has an unknown unit", () => {
		process.env.JWT_ACCESS_EXPIRES_IN = "15months";

		expect(() => authConfig()).toThrow("Invalid auth env config");
	});

	it("throws when the secret is defined but empty", () => {
		process.env.JWT_ACCESS_SECRET = "";

		expect(() => authConfig()).toThrow("Invalid auth env config");
	});
});
