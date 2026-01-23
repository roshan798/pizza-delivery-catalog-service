import config from 'config';
import { MessageProducerBroker } from '../types/broker';
import { KafkaProducerBroker } from '../../config/kafka';

let messageProducerBroker: MessageProducerBroker | null = null;
export const createMessageProducerBroker = (): MessageProducerBroker => {
	// Implementation for creating and returning a MessageProducerBroker instance
	if (messageProducerBroker === null) {
		const brokerURLs: string = config.get<string>('kafka.brokers')[0];
		messageProducerBroker = new KafkaProducerBroker(
			'catalog-service',
			brokerURLs.split(',')
		);
	}
	return messageProducerBroker;
};
