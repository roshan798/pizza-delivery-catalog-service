import { Response, Request } from 'express';
import createHttpError from 'http-errors';
import { Product, ProductCreateRequest, ProductUpdateRequest } from './types';
import { ProductService } from './productService';
import logger from '../config/logger';
import { FileStorage } from '../common/types/storage';
import { v4 as uuidv4 } from 'uuid';
import { UploadedFile } from 'express-fileupload';

export class ProductController {
	constructor(
		private readonly productService: ProductService,
		private readonly storage: FileStorage
	) {}

	async createProduct(req: ProductCreateRequest, res: Response) {
		logger.info('Entering createProduct controller');
		let productData = req.body.data;

		if (typeof productData === 'string') {
			try {
				productData = JSON.parse(productData) as Product;
			} catch (err) {
				logger.warn('Product creation failed: Invalid JSON in data');
				throw err;
			}
		}
		if (!productData) {
			logger.warn('Product creation failed: No data provided');
			throw new createHttpError.BadRequest('Product data is required');
		}
		const imageFile = req.files?.image as UploadedFile;
		if (imageFile) {
			const mime = imageFile.mimetype; // e.g. "image/png"
			const ext = mime.split('/')[1]; // "png"

			const imageName = uuidv4() + '.' + ext;
			await this.storage.upload({
				name: imageName,
				data: imageFile.data.buffer,
			});
			const imageUrl = this.storage.getObjectUri(imageName);
			productData.imageUrl = imageUrl;
			logger.info('Image file received for product creation');
		} else {
			// handle this in validation
			logger.warn('No image file provided for product creation');
			throw new createHttpError.BadRequest('Product image is required');
		}
		//

		const newProduct = await this.productService.createProduct(productData);
		logger.info(
			`Product created successfully with ID: ${newProduct._id?.toString?.() ?? newProduct._id}`
		);
		return res.status(201).json({
			message: 'Product created successfully',
			productId: newProduct._id?.toString?.() ?? newProduct._id,
		});
	}

	async getAll(req: Request, res: Response) {
		logger.info('Fetching all products');
		const products = await this.productService.getAllProducts();
		logger.info(`Fetched ${products.length} products`);
		return res.status(200).json({
			success: true,
			data: products,
		});
	}

	async getById(req: Request, res: Response) {
		const productId = req.params.id;
		logger.info(`Fetching product with ID: ${productId}`);
		const product = await this.productService.getProductById(productId);
		if (!product) {
			logger.warn(`Product not found with ID: ${productId}`);
			throw new createHttpError.NotFound('Product not found');
		}
		logger.info(`Product found with ID: ${productId}`);
		return res.status(200).json({
			success: true,
			data: product,
		});
	}

	async updateProduct(req: ProductUpdateRequest, res: Response) {
		const productId = req.params.id;
		let updateData = req.body.data;

		if (typeof updateData === 'string') {
			try {
				updateData = JSON.parse(updateData) as Partial<
					Omit<
						Product,
						| '_id'
						| 'createdAt'
						| 'updatedAt'
						| 'tenantId'
						| 'categoryId'
					>
				>;
			} catch (err) {
				if (err instanceof Error) {
					logger.warn(
						`Product update failed: Invalid JSON in data - ${err.message}`
					);
					throw new createHttpError.BadRequest(
						'Invalid JSON in data'
					);
				} else {
					logger.warn('Product update failed: Invalid JSON in data');
					throw new createHttpError.BadRequest(
						'Invalid JSON in data'
					);
				}
			}
		}

		logger.info(`Updating product with ID: ${productId}`);
		// Fetch the existing product to get the current imageUrl
		const existingProduct =
			await this.productService.getProductById(productId);
		if (!existingProduct) {
			logger.warn(`Product not found for update with ID: ${productId}`);
			throw new createHttpError.NotFound('Product not found');
		}

		// Check if a new image is uploaded
		const imageFile = req.files?.image as UploadedFile;
		if (imageFile) {
			logger.info('New image file detected, uploading to S3...');
			const mime = imageFile.mimetype;
			const ext = mime.split('/')[1];
			const newImageName = uuidv4() + '.' + ext;

			try {
				await this.storage.upload({
					name: newImageName,
					data: imageFile.data.buffer,
				});

				const newImageUrl = this.storage.getObjectUri(newImageName);

				// Only delete old image after new upload succeeds
				if (existingProduct.imageUrl) {
					try {
						await this.storage.delete(existingProduct.imageUrl);
						logger.info('Old product image deleted from S3');
					} catch (err) {
						if (err instanceof Error) {
							logger.error(
								`Failed to delete old image: ${err.message}`
							);
						} else {
							logger.warn(
								'Failed to delete old image from S3, continuing...'
							);
						}
					}
				}

				// Set the new image URL in update data
				updateData.imageUrl = newImageUrl;
				logger.info(
					'New image uploaded and imageUrl set in updateData'
				);
			} catch (err) {
				if (err instanceof Error) {
					logger.error(`Image upload failed: ${err.message}`);
				}
				logger.warn('Failed to upload new image, keeping old image');
				updateData.imageUrl = existingProduct.imageUrl;
			}
		}

		// Proceed to update product
		const updatedProduct = await this.productService.updateProduct(
			productId,
			updateData
		);

		if (!updatedProduct) {
			logger.warn(`Product not found for update with ID: ${productId}`);
			throw new createHttpError.NotFound('Product not found');
		}

		logger.info(`Product updated successfully with ID: ${productId}`);
		return res.status(200).json({
			message: 'Product updated successfully',
			success: true,
			data: updatedProduct,
		});
	}

	async deleteProduct(req: Request, res: Response) {
		const productId = req.params.id;
		logger.info(`Deleting product with ID: ${productId}`);
		const deleted = await this.productService.deleteProduct(productId);
		if (!deleted) {
			logger.warn(`Product not found for deletion with ID: ${productId}`);
			throw new createHttpError.NotFound('Product not found');
		}
		logger.info(`Product deleted successfully with ID: ${productId}`);
		return res.status(200).json({
			message: 'Product deleted successfully',
			success: true,
		});
	}
}
