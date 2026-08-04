import { TransformFnParams } from "class-transformer";

type EnvTransform<T> = (params: TransformFnParams) => T;

export function toStringArray(params: TransformFnParams): string[] {
	const value: unknown = params.value;
	if (typeof value !== "string") return [];

	return value
		.split(",")
		.map(entry => entry.trim())
		.filter(Boolean);
}

export function toBoolean(defaultValue: boolean): EnvTransform<boolean> {
	return function transform(params) {
		const value = params.value as unknown;
		if (value === undefined) return defaultValue;

		return value === "true";
	};
}
