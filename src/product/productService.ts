import { Product } from './types';
import productModel from './productModel';
import logger from '../config/logger';

export class ProductService {
	private model;

	constructor(model = productModel) {
		this.model = model;
	}

	async getAllProducts() {
		return await this.model.find();
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
