import * as crypto from "crypto";

import { GeneratePasswordService } from "../../src/admin/generate-password.service";

jest.mock("crypto", () => ({
	...jest.requireActual<typeof crypto>("crypto"),
	randomBytes: jest.fn()
}));

describe("GeneratePasswordService", () => {
	const randomBytesMock = jest.mocked(crypto.randomBytes);
	let service: GeneratePasswordService;

	beforeEach(() => {
		jest.resetAllMocks();
		service = new GeneratePasswordService();
	});

	describe("generatePassword", () => {
		it("encodes 4 random bytes as 8 hexadecimal characters", () => {
			randomBytesMock.mockImplementation(() =>
				Buffer.from([0x9f, 0x3a, 0x0c, 0x7e])
			);

			expect(service.generatePassword()).toBe("9f3a0c7e");
			expect(randomBytesMock).toHaveBeenCalledWith(4);
		});

		it("keeps the leading zeros of each byte", () => {
			randomBytesMock.mockImplementation(() =>
				Buffer.from([0x00, 0x01, 0x0a, 0xff])
			);

			expect(service.generatePassword()).toBe("00010aff");
		});
	});
});
