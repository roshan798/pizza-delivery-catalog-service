import mongoose from 'mongoose';
import config from 'config';
import logger from './logger';

export default async function initDB(): Promise<void> {
	try {
		const dbURI: string = config.get('database.url');

		await mongoose.connect(dbURI);

		logger.info('Connected to the database successfully');
	} catch (error) {
		logger.error('Database connection error:', error);
		// Optional: rethrow if you want the app to crash on DB connection failure
		// throw error;
	}
}
