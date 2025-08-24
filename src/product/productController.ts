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
		const productData = JSON.parse(req.body.data) as Product;
		if (!productData) {
			logger.warn('Product creation failed: No data provided');
			throw new createHttpError.BadRequest('Product data is required');
		}
		// TODO image upload
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
		const updateData = req.body as Partial<Product>;
		logger.info(`Updating product with ID: ${productId}`);
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
