import { plainToInstance } from "class-transformer";

import { ToLowerCase } from "../../../src/common/decorators/to-lower-case.decorator";

class Fixture {
	@ToLowerCase() value: unknown;
}

function transform(plain: object): unknown {
	return plainToInstance(Fixture, plain).value;
}

describe("ToLowerCase", () => {
	it("lowercases a mixed case string", () => {
		expect(transform({ value: "Admin@Arqueo.local" })).toBe(
			"admin@arqueo.local"
		);
	});

	it("leaves an already lowercase string untouched", () => {
		expect(transform({ value: "admin@arqueo.local" })).toBe(
			"admin@arqueo.local"
		);
	});

	it("lowercases accented characters", () => {
		expect(transform({ value: "ÁNGEL@Arqueo.local" })).toBe(
			"ángel@arqueo.local"
		);
	});

	it("does not trim surrounding whitespace", () => {
		expect(transform({ value: "  Ada  " })).toBe("  ada  ");
	});

	it("leaves the property undefined when the key is absent", () => {
		expect(transform({})).toBeUndefined();
	});

	it.each([
		["null", null],
		["a number", 42],
		["a boolean", true]
	])("passes %s through untouched", (_label, input) => {
		expect(transform({ value: input })).toBe(input);
	});

	it("passes an object through without stringifying it", () => {
		expect(transform({ value: { a: 1 } })).toEqual({ a: 1 });
	});
});
