import * as bcrypt from "bcrypt";

import { HashingService } from "../../../src/common/hashing/hashing.service";

jest.mock("bcrypt");

const SALT_ROUNDS = 12;
const PLAIN = "correct horse battery staple";
const HASHED = "$2b$12$abcdefghijklmnopqrstuv";

describe("HashingService", () => {
	const bcryptMock = jest.mocked(bcrypt);
	let service: HashingService;

	beforeEach(() => {
		jest.resetAllMocks();
		service = new HashingService();
	});

	describe("hash", () => {
		it("hashes the plain text with 12 salt rounds", async () => {
			bcryptMock.hash.mockResolvedValue(HASHED as never);

			await expect(service.hash(PLAIN)).resolves.toBe(HASHED);
			expect(bcryptMock.hash).toHaveBeenCalledWith(PLAIN, SALT_ROUNDS);
		});

		it("rethrows any error from bcrypt untouched", async () => {
			const error = new Error("out of memory");
			bcryptMock.hash.mockRejectedValue(error as never);

			await expect(service.hash(PLAIN)).rejects.toBe(error);
		});
	});

	describe("verify", () => {
		it("returns true when the plain text matches the hash", async () => {
			bcryptMock.compare.mockResolvedValue(true as never);

			await expect(service.verify(PLAIN, HASHED)).resolves.toBe(true);
			expect(bcryptMock.compare).toHaveBeenCalledWith(PLAIN, HASHED);
		});

		it("returns false when the plain text does not match the hash", async () => {
			bcryptMock.compare.mockResolvedValue(false as never);

			await expect(service.verify(PLAIN, HASHED)).resolves.toBe(false);
		});
	});
});
