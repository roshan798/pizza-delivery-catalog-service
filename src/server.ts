import config from 'config';
import app from './app';
import logger from './config/logger';
import initDB from './config/db';
import { MessageProducerBroker } from './common/types/broker';
import { createMessageProducerBroker } from './common/factories/brokerFactory';

const startServer = async () => {
	const port: number = config.get('server.port');
	await initDB();
	let messageProducerBroker: MessageProducerBroker | null = null;
	try {
		messageProducerBroker = createMessageProducerBroker();
		await messageProducerBroker.connect();
		logger.info('Connected to Kafka broker');
		app.listen(port, () => {
			logger.info(`Server is running on ${port}`);
		});
	} catch (error) {
		logger.error('Error starting the server:', error);
		if (messageProducerBroker !== null) {
			await messageProducerBroker.disconnect();
		}
		process.exit(1);
	}
};

(async () => {
	await startServer();
})().catch((error) => {
	logger.error('Fatal error starting server:', error);
	process.exit(1);
});
