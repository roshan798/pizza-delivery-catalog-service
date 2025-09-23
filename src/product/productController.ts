import { Response, Request } from 'express';
import createHttpError from 'http-errors';
import { Product, ProductCreateRequest, ProductUpdateRequest } from './types';
import { ProductService } from './productService';
import logger from '../config/logger';
import { FileStorage } from '../common/types/storage';
import { v4 as uuidv4 } from 'uuid';
import { UploadedFile } from 'express-fileupload';
import { AuthRequest, Roles } from '../common/types';

interface ProductCreateWithAuth extends Request {
	auth: AuthRequest['auth'];
	body: ProductCreateRequest['body'];
}
export interface AuthenticatedRequest<T> extends Request {
	auth: AuthRequest['auth'];
	body: T;
}
interface ProductUpdateWithAuth extends Request {
	auth: AuthRequest['auth'];
	body: ProductUpdateRequest['body'];
}
interface ProductDeleteWithAuth extends Request {
	auth: AuthRequest['auth'];
	params: { id: string };
}

export class ProductController {
	constructor(
		private readonly productService: ProductService,
		private readonly storage: FileStorage
	) {}

	// ---------------- CREATE ----------------
	async createProduct(_req: Request, res: Response) {
		const req = _req as ProductCreateWithAuth;
		logger.info('Entering createProduct controller');
		let productData = req.body.data;

		if (typeof productData === 'string') {
			try {
				productData = JSON.parse(productData) as Product;
			} catch (err) {
				if (err instanceof Error) {
					logger.error(`Product creation failed: ${err.message}`);
				}
				logger.warn('Product creation failed: Invalid JSON in data');
				throw new createHttpError.BadRequest('Invalid JSON in data');
			}
		}
		if (!productData) {
			logger.warn('Product creation failed: No data provided');
			throw new createHttpError.BadRequest('Product data is required');
		}

		if (req.auth.role === Roles.MANAGER) {
			productData.tenantId = req.auth.tenantId!;
			logger.info(
				`Manager detected, forcing tenantId=${productData.tenantId}`
			);
		}

		const imageFile = req.files?.image as UploadedFile;
		if (!imageFile) {
			logger.warn('No image file provided for product creation');
			throw new createHttpError.BadRequest('Product image is required');
		}

		const mime = imageFile.mimetype;
		const ext = mime.split('/')[1];
		const imageName = uuidv4() + '.' + ext;

		await this.storage.upload({
			name: imageName,
			data: imageFile.data.buffer,
		});
		productData.imageUrl = this.storage.getObjectUri(imageName);

		const newProduct = await this.productService.createProduct(productData);
		logger.info(`Product created successfully: ${String(newProduct._id)}`);

		return res.status(201).json({
			message: 'Product created successfully',
			productId: newProduct._id?.toString?.() ?? newProduct._id,
		});
	}

	// ---------------- GET ALL ----------------
	async getAll(_req: Request, res: Response) {
		const req = _req as AuthenticatedRequest<null>;
		logger.info('Fetching all products');
		let tenantId: string | undefined;
		if (req.auth && req.auth.role === Roles.MANAGER) {
			tenantId = req.auth.tenantId!;
			logger.info(`Manager detected, forcing tenantId=${tenantId}`);
		}
		const products = await this.productService.getAllProducts(tenantId);
		logger.info(`Fetched ${products.length} products`);
		return res.status(200).json({ success: true, data: products });
	}

	// ---------------- GET BY ID ----------------
	async getById(req: Request, res: Response) {
		const productId = req.params.id;
		logger.info(`Fetching product with ID: ${productId}`);
		const product = await this.productService.getProductById(productId);

		if (!product) {
			logger.warn(`Product not found: ${productId}`);
			throw new createHttpError.NotFound('Product not found');
		}

		return res.status(200).json({ success: true, data: product });
	}

	// ---------------- UPDATE ----------------
	async updateProduct(_req: Request, res: Response) {
		const req = _req as ProductUpdateWithAuth;
		const productId = req.params.id;
		logger.info(`Entering updateProduct: ${productId}`);

		let updateData = req.body?.data;

		// Tenant ownership check for managers
		if (req.auth.role === Roles.MANAGER) {
			const product = await this.productService.getProductById(productId);
			if (req.auth.tenantId !== product?.tenantId) {
				throw new createHttpError.Forbidden(
					'You are not authorised to update this product.'
				);
			}
		}

		// Parse update data
		if (updateData && typeof updateData === 'string') {
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
					logger.error(`Product update failed: ${err.message}`);
				}
				logger.warn('Invalid JSON in update data');
				throw new createHttpError.BadRequest('Invalid JSON in data');
			}
		}

		const existingProduct =
			await this.productService.getProductById(productId);
		if (!existingProduct) {
			throw new createHttpError.NotFound('Product not found');
		}

		const imageFile = req.files?.image as UploadedFile;

		// Require at least some update
		if (!updateData && !imageFile) {
			throw new createHttpError.BadRequest(
				'No data or image provided for update'
			);
		}

		// Handle new image upload
		if (imageFile) {
			const mime = imageFile.mimetype;
			const ext = mime.split('/')[1];
			const newImageName = uuidv4() + '.' + ext;

			try {
				await this.storage.upload({
					name: newImageName,
					data: imageFile.data.buffer,
				});
				const newImageUrl = this.storage.getObjectUri(newImageName);

				// Delete old image
				if (existingProduct.imageUrl) {
					try {
						await this.storage.delete(existingProduct.imageUrl);
						logger.info('Old image deleted from storage');
					} catch (err) {
						logger.error(
							`Failed to delete old image: ${(err as Error).message}`
						);
					}
				}

				updateData = { ...updateData, imageUrl: newImageUrl };
			} catch (err) {
				logger.error(`Image upload failed: ${(err as Error).message}`);
				updateData = {
					...updateData,
					imageUrl: existingProduct.imageUrl,
				};
			}
		}

		const updatedProduct = await this.productService.updateProduct(
			productId,
			updateData
		);
		if (!updatedProduct) {
			throw new createHttpError.NotFound('Product not found');
		}

		logger.info(`Product updated successfully: ${productId}`);
		return res.status(200).json({
			message: 'Product updated successfully',
			success: true,
			data: updatedProduct,
		});
	}

	// ---------------- DELETE ----------------
	async deleteProduct(_req: Request, res: Response) {
		const req = _req as ProductDeleteWithAuth;
		const productId = req.params.id;
		logger.info(`Deleting product: ${productId}`);

		const product = await this.productService.getProductById(productId);
		if (!product) {
			throw new createHttpError.NotFound('Product not found');
		}

		// Tenant ownership check for managers
		if (
			req.auth.role === Roles.MANAGER &&
			req.auth.tenantId !== product.tenantId
		) {
			throw new createHttpError.Forbidden(
				'You are not authorised to delete this product.'
			);
		}

		const deleted = await this.productService.deleteProduct(productId);
		if (!deleted) {
			throw new createHttpError.NotFound('Product not found');
		}

		logger.info(`Product deleted successfully: ${productId}`);
		return res
			.status(200)
			.json({ message: 'Product deleted successfully', success: true });
	}
}
