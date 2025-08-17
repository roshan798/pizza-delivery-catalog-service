import config from 'config';
import app from './app';
import logger from './config/logger';

const startServer = () => {
	const port: number = config.get('server.port');
	try {
		app.listen(port, () => {
			logger.info(`Server is running on ${port}`);
		});
	} catch (error) {
		logger.error('Error starting the server:', error);
		process.exit(1);
	}
};

startServer();
