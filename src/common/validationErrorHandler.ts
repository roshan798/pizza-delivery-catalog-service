import { validationResult } from 'express-validator';
import { Response, Request, NextFunction } from 'express';
import logger from '../config/logger';

const expressValidatorErrorHandler = (
	req: Request,
	res: Response,
	next: NextFunction
): void => {
	logger.info(
		`[EXPRESS_VALIDATOR] Request was ${req.method} ${req.originalUrl}`
	);

	const validationErrors = validationResult(req);

	if (!validationErrors.isEmpty()) {
		logger.warn('[EXPRESS_VALIDATOR] Input validation failed');
		res.status(400).json({
			success: false,
			message: 'Invalid input data',
			errors: validationErrors.array(),
		});
		return;
	}

	logger.info('[EXPRESS_VALIDATOR] Input validation passed');
	next();
};

export default expressValidatorErrorHandler;
