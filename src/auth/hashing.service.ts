import { Injectable } from "@nestjs/common";
import * as bcrypt from "bcrypt";

@Injectable()
export class HashingService {
	readonly #saltRounds = 12;

	async hash(plain: string): Promise<string> {
		return await bcrypt.hash(plain, this.#saltRounds);
	}

	async verify(plain: string, hashed: string): Promise<boolean> {
		return await bcrypt.compare(plain, hashed);
	}
}
