import { Request } from 'express';
import { UploadedFile } from 'express-fileupload';
export const Roles = {
	ADMIN: 'admin',
	CUSTOMER: 'customer',
	MANAGER: 'manager',
} as const;

export type AuthCookie = {
	accessToken: string;
	refreshToken: string;
};

export interface AuthRequest extends Request {
	auth: {
		id?: string;
		sub: string;
		role: string;
		tenantId?: string;
		iat?: number;
		exp?: number;
		iss?: string;
		jti?: string;
	};
}

export interface AuthenticatedRequest<T> extends Request {
	auth: AuthRequest['auth'];
	body: T;
}
export interface AuthinticateRequestWithImage<T> extends Request {
	auth: AuthRequest['auth'];
	body: T;
	files: {
		image?: UploadedFile;
	};
}
