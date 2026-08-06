import { Transform, TransformFnParams } from "class-transformer";

export function Trim(): PropertyDecorator {
	return Transform((params: TransformFnParams) => {
		const value = params.value as unknown;
		if (typeof value !== "string") return value;

		return value.trim();
	});
}
