import {
	ArgumentsHost,
	ConflictException,
	NotFoundException
} from "@nestjs/common";
import { FILTER_CATCH_EXCEPTIONS } from "@nestjs/common/constants";

import { createErrorsFilter } from "../../../src/common/filters/create-errors-filter";

class RecordNotFoundError extends Error {
	constructor() {
		super("Record 42 not found");
	}
}

class DuplicateRecordError extends Error {
	constructor() {
		super("Record 42 already exists");
	}
}

class ArchivedRecordNotFoundError extends RecordNotFoundError {}

class UnmappedError extends Error {}

const RecordsErrorsFilter = createErrorsFilter([
	[RecordNotFoundError, NotFoundException],
	[DuplicateRecordError, ConflictException]
]);

function createHostMock() {
	const response = {
		status: jest.fn().mockReturnThis(),
		json: jest.fn()
	};
	const host = {
		switchToHttp: () => ({ getResponse: () => response })
	} as unknown as ArgumentsHost;

	return { host, response };
}

describe("createErrorsFilter", () => {
	it("answers a mapped error with the status and body of its exception", () => {
		const { host, response } = createHostMock();

		new RecordsErrorsFilter().catch(new RecordNotFoundError(), host);

		expect(response.status).toHaveBeenCalledWith(404);
		expect(response.json).toHaveBeenCalledWith({
			message: "Record 42 not found",
			error: "Not Found",
			statusCode: 404
		});
	});

	it("uses the exception mapped to each error", () => {
		const { host, response } = createHostMock();

		new RecordsErrorsFilter().catch(new DuplicateRecordError(), host);

		expect(response.status).toHaveBeenCalledWith(409);
		expect(response.json).toHaveBeenCalledWith({
			message: "Record 42 already exists",
			error: "Conflict",
			statusCode: 409
		});
	});

	it("answers a subclass with the exception of its mapped parent", () => {
		const { host, response } = createHostMock();

		new RecordsErrorsFilter().catch(
			new ArchivedRecordNotFoundError(),
			host
		);

		expect(response.status).toHaveBeenCalledWith(404);
	});

	it("answers 500 without exposing the message when the error is not mapped", () => {
		const { host, response } = createHostMock();

		new RecordsErrorsFilter().catch(new UnmappedError("secret"), host);

		expect(response.status).toHaveBeenCalledWith(500);
		expect(response.json).toHaveBeenCalledWith({
			message: "Internal Server Error",
			statusCode: 500
		});
	});

	it("catches exactly the mapped error classes", () => {
		expect(
			Reflect.getMetadata(FILTER_CATCH_EXCEPTIONS, RecordsErrorsFilter)
		).toEqual([RecordNotFoundError, DuplicateRecordError]);
	});

	it("creates an independent filter class for each table", () => {
		const OtherErrorsFilter = createErrorsFilter([
			[UnmappedError, ConflictException]
		]);

		expect(OtherErrorsFilter).not.toBe(RecordsErrorsFilter);
		expect(
			Reflect.getMetadata(FILTER_CATCH_EXCEPTIONS, OtherErrorsFilter)
		).toEqual([UnmappedError]);
		expect(
			Reflect.getMetadata(FILTER_CATCH_EXCEPTIONS, RecordsErrorsFilter)
		).toEqual([RecordNotFoundError, DuplicateRecordError]);
	});
});
