import { Transform, TransformFnParams } from "class-transformer";

export function ToLowerCase(): PropertyDecorator {
	return Transform((params: TransformFnParams) => {
		const value = params.value as unknown;
		if (typeof value !== "string") return value;

		return value.toLowerCase();
	});
}
