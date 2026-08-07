import { CustomDecorator, SerializeOptions, Type } from "@nestjs/common";

export function Serialize(dto: Type): CustomDecorator {
	return SerializeOptions({ type: dto });
}
