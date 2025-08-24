import {
	PutObjectCommand,
	PutObjectCommandInput,
	S3Client,
} from '@aws-sdk/client-s3';
import config from 'config';
import { FileData, FileStorage } from '../types/storage';
import logger from '../../config/logger';
import createHttpError from 'http-errors';

export class S3Storage implements FileStorage {
	private readonly client: S3Client;
	private readonly bucketName: string =
		config.get('storage.s3.bucketName') || 'mernspace-pizza-app';
	private readonly region: string =
		config.get('storage.s3.region') || 'ap-south-1';
	constructor() {
		this.client = new S3Client({
			region: config.get('storage.s3.region'),
			credentials: {
				accessKeyId: config.get('storage.s3.accessKey') || '',
				secretAccessKey: config.get('storage.s3.secretAccessKey') || '',
			},
		});
	}

	async upload(file: FileData): Promise<void> {
		const objParams = {
			Bucket: this.bucketName,
			Key: file.name,
			Body: Buffer.from(file.data),
		};
		await this.client
			.send(new PutObjectCommand(objParams as PutObjectCommandInput))
			.then((res) => {
				logger.info('File uploaded successfully to S3');
				logger.debug('S3 upload response', res);
			})
			.catch((err) => {
				logger.error('Error uploading file to S3', err);
				throw createHttpError.InternalServerError(
					'Error uploading file to storage'
				);
			});
	}

	delete(fileName: string): void {
		throw new Error('Method not implemented.' + fileName);
	}
	getObjectUri(fileName: string): string {
		return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${fileName}`;
	}
}
