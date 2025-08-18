import mongoose from 'mongoose';
import config from 'config';
import logger from './logger';
export default function initDB() {
	// This function initializes the database connection
	// It can be used to set up the connection pool or any other database-related setup
	const dbURI: string = config.get('database.url');
	mongoose
		.connect(dbURI)
		.then(() => {
			logger.info('Connected to the database successfully');
		})
		.catch((error) => {
			logger.error('Database connection error:', error);
		});
}
