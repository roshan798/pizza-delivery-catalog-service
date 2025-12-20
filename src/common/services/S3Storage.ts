import {
	DeleteObjectCommand,
	DeleteObjectCommandInput,
	PutObjectCommand,
	PutObjectCommandInput,
	S3Client,
} from '@aws-sdk/client-s3';
import config from 'config';
import { FileData, FileStorage } from '../types/storage';
import logger from '../../config/logger';
import createHttpError from 'http-errors';
import sharp from 'sharp';

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
		logger.info(
			`Uploading file: ${file.name} to S3 bucket: ${this.bucketName}`
		);
		const compressedFile = await this.compress(file);
		const objParams = {
			Bucket: this.bucketName,
			Key: file.name,
			Body: compressedFile,
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

	async delete(fileNameOrUrl: string): Promise<void> {
		if (!fileNameOrUrl) return;

		// extract key if full URL is provided
		const key = fileNameOrUrl.includes('http')
			? fileNameOrUrl.split('/').pop()
			: fileNameOrUrl;

		if (!key) return;

		const params: DeleteObjectCommandInput = {
			Bucket: this.bucketName,
			Key: key,
		};

		try {
			await this.client.send(new DeleteObjectCommand(params));
			logger.info(`File deleted successfully from S3: ${key}`);
		} catch (err) {
			logger.error(`Error deleting file from S3: ${key}`, err);
		}
	}
	getObjectUri(fileName: string): string {
		return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${fileName}`;
	}
	async compress(file: FileData): Promise<Buffer> {
		const targetSizeKB = 500;
		const minQuality = 30;
		const maxQuality = 80;
		let quality = maxQuality;
		let compressedBuffer = Buffer.from(file.data);

		while (quality >= minQuality) {
			compressedBuffer = await sharp(compressedBuffer)
				.jpeg({ quality })
				.toBuffer();

			const sizeKB = compressedBuffer.length / 1024;
			if (sizeKB <= targetSizeKB) {
				break;
			}
			quality -= 5;
		}

		return compressedBuffer;
	}
}
