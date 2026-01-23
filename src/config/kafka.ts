import { Kafka, Producer } from 'kafkajs';
import { MessageProducerBroker } from '../common/types/broker';

export class KafkaProducerBroker implements MessageProducerBroker {
	private kafka: Kafka;
	private producer: Producer;

	constructor(clientId: string, brokers: string[]) {
		this.kafka = new Kafka({
			clientId: clientId,
			brokers: brokers,
		});
		this.producer = this.kafka.producer();
	}

	/*
	 * Connects the Kafka producer.
	 */
	public async connect(): Promise<void> {
		await this.producer.connect();
	}

	/*
	 * Disconnects the Kafka producer.
	 */
	public async disconnect(): Promise<void> {
		if (this.producer) {
			await this.producer.disconnect();
		}
	}

	/*
	 * Sends a message to the specified Kafka topic.
	 * @param topic - The Kafka topic to send the message to.
	 * @param message - The message to be sent.
	 * @Throws {Error} - when theproducer fails to send the message.
	 */

	public async sendMessage(topic: string, message: string): Promise<void> {
		await this.producer.send({
			topic: topic,
			messages: [{ value: message }],
		});
	}
}
