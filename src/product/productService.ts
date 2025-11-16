import { Product } from './types';
import productModel from './productModel';
import logger from '../config/logger';
import { FilterQuery, SortOrder } from 'mongoose';
import { ProductQueryParams } from './productController';

// product.service.ts
export type GetAllFilters = Required<
	Pick<ProductQueryParams, 'page' | 'limit' | 'skip' | 'order' | 'sortBy'>
> &
	Pick<
		ProductQueryParams,
		| 'tenantId'
		| 'categoryId'
		| 'name'
		| 'priceMin'
		| 'priceMax'
		| 'isPublished'
	>;

export type GetAllServiceResult<T> = {
	items: T[];
	meta: {
		total: number;
		page: number;
		limit: number;
		totalPages: number;
		hasNextPage: boolean;
		hasPrevPage: boolean;
	};
};

export class ProductService {
	private model;

	constructor(model = productModel) {
		this.model = model;
	}

	async getAllProducts(filters: GetAllFilters) {
		const {
			tenantId,
			categoryId,
			name,
			// priceMin,
			// priceMax,
			isPublished,
			sortBy = 'createdAt',
			order = 'desc',
			page,
			limit,
			skip,
		} = filters;

		const query: FilterQuery<any> = {};

		if (tenantId && tenantId !== 'all') query.tenantId = tenantId;
		if (categoryId) query.categoryId = categoryId;

		if (typeof isPublished === 'boolean') {
			query.isPublished = isPublished;
		}

		if (name && name.trim().length > 0) {
			query.name = { $regex: name.trim(), $options: 'i' };
		}

		// Price range
		// if (priceMin != null || priceMax != null) {
		// 	query.price = {};
		// 	if (priceMin != null) query.price.$gte = priceMin;
		// 	if (priceMax != null) query.price.$lte = priceMax;
		// }

		const sortDir: SortOrder = order === 'asc' ? 1 : -1; // 1 asc, -1 desc
		const sortSpec: Record<string, SortOrder> = { [sortBy]: sortDir }; // { createdAt: -1 }

		const [items, total] = await Promise.all([
			this.model
				.find(query)
				.sort(sortSpec)
				.skip(skip)
				.limit(limit)
				.lean()
				.exec(),
			this.model.countDocuments(query).exec(),
		]);

		const totalPages = Math.max(1, Math.ceil(total / Math.max(1, limit)));

		logger.debug(
			`Products query q=${JSON.stringify(query)} sort=${JSON.stringify(
				sortSpec
			)} page=${page} limit=${limit} skip=${skip} total=${total}`
		);

		return {
			items,
			meta: {
				page,
				limit,
				total,
				totalPages,
				hasNextPage: page < totalPages,
				hasPrevPage: page > 1,
			},
		};
	}

	async getProductById(id: string) {
		if (id) {
			const product = await this.model.findById(id);
			logger.debug(`Found product: ${JSON.stringify(product)}`);
			return product;
		}
		return null;
	}

	async createProduct(productData: Product) {
		return await this.model.create(productData);
	}

	async updateProduct(id: string, productData: Partial<Product>) {
		if (id) {
			const updatedProduct = await this.model.findByIdAndUpdate(
				id,
				productData,
				{ new: true }
			);
			logger.debug(
				`Updated product with ID ${id}: ${JSON.stringify(updatedProduct)}`
			);
			return updatedProduct;
		}
		return null;
	}

	async deleteProduct(id: string) {
		if (id) {
			const deletedProduct = await this.model.findByIdAndDelete(id);
			logger.debug(
				`Deleted product with ID ${id}: ${JSON.stringify(deletedProduct)}`
			);
			return deletedProduct;
		}
		return null;
	}
}
