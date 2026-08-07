import { Injectable } from "@nestjs/common";
import { randomBytes } from "crypto";

@Injectable()
export class GeneratePasswordService {
	generatePassword(): string {
		return randomBytes(4).toString("hex");
	}
}
