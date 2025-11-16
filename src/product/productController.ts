import { Response, Request } from 'express';
import createHttpError from 'http-errors';
import { Product, ProductCreateRequest, ProductUpdateRequest } from './types';
import { GetAllFilters, ProductService } from './productService';
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

//
export type SortOrder = 'asc' | 'desc';

export interface ProductQueryParams extends Record<string, any> {
	// Pagination
	page?: number;
	limit?: number;
	skip?: number;

	// Filters
	tenantId?: string;
	categoryId?: string;
	name?: string;
	priceMin?: number;
	priceMax?: number;
	isPublished?: boolean;

	// Sorting
	sortBy?: 'createdAt' | 'name';
	order?: SortOrder;
}

// Response type for paginated results
export interface PaginatedResponse<T> {
	success: boolean;
	data: {
		items: T[];
		metadata: {
			totalItems: number;
			currentPage: number;
			pageSize: number;
			totalPages: number;
			hasNextPage: boolean;
			hasPreviousPage: boolean;
		};
	};
}
export interface ProductGetAllRequest extends Request {
	// auth?: AuthRequest['auth'];
	query: Partial<ProductQueryParams>;
}
//

export class ProductController {
	constructor(
		private readonly productService: ProductService,
		private readonly storage: FileStorage
	) {}

	// ---------------- GET ALL ----------------
	async getAll(_req: Request, res: Response) {
		const req = _req as Request & { log: any };

		// Raw query log
		// logger.debug({ msg: 'Raw query received', query: req.query });
		logger.info('Entering getAll controller');

		const {
			tenantId,
			categoryId,
			name,
			sortBy = 'createdAt',
			order = 'desc',
			page: pageRaw = '1',
			limit: limitRaw = '20',
			skip: skipRaw,
			priceMin: priceMinRaw,
			priceMax: priceMaxRaw,
			isPublished: isPublishedRaw = '1',
		} = req.query as Record<string, string | undefined>;

		const page = Math.max(1, parseInt(pageRaw ?? '1', 10) || 1);
		const limit = Math.min(
			100,
			Math.max(1, parseInt(limitRaw ?? '20', 10) || 20)
		);
		const skipNum = parseInt(skipRaw ?? '', 10);
		const skip =
			Number.isFinite(skipNum) && skipNum >= 0
				? skipNum
				: (page - 1) * limit;

		const priceMin = priceMinRaw != null ? Number(priceMinRaw) : undefined;
		const priceMax = priceMaxRaw != null ? Number(priceMaxRaw) : undefined;

		const isPublished =
			typeof isPublishedRaw === 'string'
				? ['true', '1'].includes(isPublishedRaw.toLowerCase())
					? true
					: ['false', '0'].includes(isPublishedRaw.toLowerCase())
						? false
						: true
				: true;

		const safeOrder: SortOrder =
			order?.toLowerCase() === 'asc' ? 'asc' : 'desc';
		const safeSortBy: NonNullable<ProductQueryParams['sortBy']> =
			sortBy === 'name' ? 'name' : 'createdAt';

		const filters: GetAllFilters = {
			tenantId: tenantId || undefined,
			categoryId: categoryId || undefined,
			name: name || undefined,
			priceMin,
			priceMax,
			isPublished,
			sortBy: safeSortBy,
			order: safeOrder,
			page,
			limit,
			skip,
		};

		// Log normalized filters before hitting service
		logger.info('Fetching products with filters' + JSON.stringify(filters));

		const t0 = process.hrtime.bigint();
		const result = await this.productService.getAllProducts(filters);
		const elapsedMs = Number(
			(process.hrtime.bigint() - t0) / BigInt(1_000_000)
		);

		// Log success with metadata
		logger.info(
			JSON.stringify({
				msg: 'Products fetched',
				count: result.items?.length ?? 0,
				page: result.meta?.page,
				pageSize: result.meta?.limit,
				total: result.meta?.total,
				elapsedMs,
			})
		);

		const response = {
			success: true,
			data: {
				items: result.items,
				metadata: {
					totalItems: result.meta.total,
					currentPage: result.meta.page,
					pageSize: result.meta.limit,
					totalPages: result.meta.totalPages,
					hasNextPage: result.meta.hasNextPage,
					hasPreviousPage: result.meta.hasPrevPage,
				},
			},
		};

		return res.status(200).json(response);
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
