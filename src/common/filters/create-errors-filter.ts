import {
	ArgumentsHost,
	Catch,
	ExceptionFilter,
	HttpException,
	InternalServerErrorException,
	Type
} from "@nestjs/common";
import { Response } from "express";

type ErrorClass = abstract new (...args: never[]) => Error;
type ExceptionClass = new (message: string) => HttpException;

export type ErrorMapping = readonly [ErrorClass, ExceptionClass];

export function createErrorsFilter(
	mappings: readonly ErrorMapping[]
): Type<ExceptionFilter> {
	@Catch(...mappings.map(([ErrorClass]) => ErrorClass))
	class ErrorsFilter implements ExceptionFilter<Error> {
		catch(error: Error, host: ArgumentsHost): void {
			const mapping = mappings.find(
				([ErrorClass]) => error instanceof ErrorClass
			);
			const exception = mapping
				? new mapping[1](error.message)
				: new InternalServerErrorException();

			host.switchToHttp()
				.getResponse<Response>()
				.status(exception.getStatus())
				.json(exception.getResponse());
		}
	}

	return ErrorsFilter;
}
