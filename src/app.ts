import express, { NextFunction, Request, Response } from 'express';
import logger from './config/logger';
import { HttpError } from 'http-errors';

const app = express();

app.get('/', (req, res) => {
	res.json({ message: 'Welcome to Auth-Service 👋' });
});

// globlal error handler

// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
app.use((err: HttpError, req: Request, res: Response, next: NextFunction) => {
	logger.info('Global error handler triggered');
	logger.error('Error details:', { error: err.message });
	const status = err.status || 500;
	const message = err.message || 'Internal Server Error';
	res.status(status).json({
		errors: [
			{
				type: err.name || 'UnknownError',
				message: message,
				stack: '', // Config.NODE_ENV === 'development' ? err.stack : undefined,
				path: req.originalUrl,
			},
		],
	});
});
export default app;
