import {
	CanActivate,
	ExecutionContext,
	Injectable,
	UnauthorizedException
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";

import { UserNotFoundError } from "../../users/users.errors";
import { UsersService } from "../../users/users.service";
import { AuthUser } from "../interfaces/auth-user.interface";
import { AuthenticatedRequest } from "../interfaces/authenticated-request.interface";
import { JwtPayload } from "../interfaces/jwt-payload.interface";

@Injectable()
export class JwtAuthGuard implements CanActivate {
	constructor(
		private readonly jwtService: JwtService,
		private readonly usersService: UsersService
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context
			.switchToHttp()
			.getRequest<AuthenticatedRequest>();

		const token = this.extractToken(request);
		if (!token) throw new UnauthorizedException();

		const payload = await this.verify(token);
		request.user = await this.findUser(payload.sub);

		return true;
	}

	private extractToken(request: Request): string | undefined {
		const [type, token] = request.headers.authorization?.split(" ") ?? [];
		return type === "Bearer" ? token : undefined;
	}

	private async verify(token: string): Promise<JwtPayload> {
		try {
			return await this.jwtService.verifyAsync<JwtPayload>(token);
		} catch {
			throw new UnauthorizedException();
		}
	}

	private async findUser(id: string): Promise<AuthUser> {
		try {
			const user = await this.usersService.findById(id, false);
			return {
				id: user.id,
				name: user.name,
				email: user.email,
				isAdmin: user.isAdmin
			};
		} catch (error) {
			if (error instanceof UserNotFoundError)
				throw new UnauthorizedException();
			throw error;
		}
	}
}
