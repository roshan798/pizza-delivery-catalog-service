import { NextFunction, Response, Request } from 'express';
import { ProductCreateRequest } from './types';
import createHttpError from 'http-errors';
import config from 'config';

export const parseData = (
	req: ProductCreateRequest,
	_res: Response,
	next: NextFunction
) => {
	try {
		if (req.body?.data && typeof req.body.data === 'string') {
			req.body = {
				...req.body,
				...JSON.parse(req.body.data),
			} as unknown as ProductCreateRequest['body'];
		}
		next();
	} catch (err) {
		if (err instanceof Error && err.name === 'SyntaxError') {
			return next(
				new createHttpError.BadRequest("Invalid JSON in 'data' field")
			);
		}
		return next(
			new createHttpError.BadRequest("Invalid JSON in 'data' field")
		);
	}
};
const MAX_FILE_SIZE: number =
	config.get('storage.maxUploadSize') || 2 * 1024 * 1024; // 2MB
export const fileUploadOptions = {
	limits: { fileSize: MAX_FILE_SIZE },
	abortOnLimit: true,
	responseOnLimit: 'File size limit has been reached',
	limitHandler: (req: Request, res: Response, next: NextFunction) => {
		const err = createHttpError(413, 'File size limit has been reached');
		next(err);
	},
};
