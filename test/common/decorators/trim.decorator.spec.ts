import { plainToInstance } from "class-transformer";

import { Trim } from "../../../src/common/decorators/trim.decorator";

class Fixture {
	@Trim() value: unknown;
}

function transform(plain: object): unknown {
	return plainToInstance(Fixture, plain).value;
}

describe("Trim", () => {
	it("removes surrounding spaces", () => {
		expect(transform({ value: "  ada@arqueo.local  " })).toBe(
			"ada@arqueo.local"
		);
	});

	it("removes tabs and newlines", () => {
		expect(transform({ value: "\t\nada@arqueo.local\n " })).toBe(
			"ada@arqueo.local"
		);
	});

	it("keeps whitespace inside the string", () => {
		expect(transform({ value: "  Ada  King  " })).toBe("Ada  King");
	});

	it("leaves an already trimmed string untouched", () => {
		expect(transform({ value: "ada@arqueo.local" })).toBe(
			"ada@arqueo.local"
		);
	});

	it("does not change the case", () => {
		expect(transform({ value: "  Ada@Arqueo.local  " })).toBe(
			"Ada@Arqueo.local"
		);
	});

	it("turns a blank string into an empty one, for IsNotEmpty to reject", () => {
		expect(transform({ value: "   " })).toBe("");
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
