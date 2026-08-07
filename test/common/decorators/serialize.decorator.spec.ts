import {
	CallHandler,
	ClassSerializerInterceptor,
	ExecutionContext
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Expose } from "class-transformer";
import { lastValueFrom, of } from "rxjs";

import { Serialize } from "../../../src/common/decorators/serialize.decorator";

class Entity {
	id = "1";
	name = "Ada Lovelace";
	password = "$2b$12$hash";
}

class EntityResponse {
	@Expose() readonly id: string;
	@Expose() readonly name: string;
}

const serialized = (): undefined => undefined;
Serialize(EntityResponse)(serialized);

const plain = (): undefined => undefined;

const interceptor = new ClassSerializerInterceptor(new Reflector(), {
	excludeExtraneousValues: true
});

async function respond(
	handler: () => undefined,
	value: unknown
): Promise<unknown> {
	const context = {
		getHandler: () => handler,
		getClass: () => Entity
	} as unknown as ExecutionContext;
	const next: CallHandler = { handle: () => of(value) };

	return await lastValueFrom(interceptor.intercept(context, next));
}

describe("Serialize", () => {
	it("keeps only the fields exposed by the dto", async () => {
		await expect(respond(serialized, new Entity())).resolves.toEqual({
			id: "1",
			name: "Ada Lovelace"
		});
	});

	it("serializes each item of an array", async () => {
		await expect(respond(serialized, [new Entity()])).resolves.toEqual([
			{ id: "1", name: "Ada Lovelace" }
		]);
	});

	it("serializes a plain object", async () => {
		const value = { id: "1", name: "Ada Lovelace", password: "9f3a0c7e" };

		await expect(respond(serialized, value)).resolves.toEqual({
			id: "1",
			name: "Ada Lovelace"
		});
	});

	it("leaves no field of an entity when the handler has no dto", async () => {
		await expect(respond(plain, new Entity())).resolves.toEqual({});
	});

	it("passes a plain object through when the handler has no dto", async () => {
		await expect(respond(plain, { deactivated: true })).resolves.toEqual({
			deactivated: true
		});
	});
});
