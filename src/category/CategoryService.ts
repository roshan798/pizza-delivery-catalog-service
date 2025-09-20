import { Category, CategoryListItem } from './types';
import CategoryModel from './categoryModel';
import logger from '../config/logger';
export class CategoryService {
	private model;

	constructor(model = CategoryModel) {
		this.model = model;
	}

	async getAllCategories() {
		return await this.model.find();
	}
	async getAllCategoriesList() {
		const categories: CategoryListItem[] = await this.model
			.find()
			.select('name createdAt updatedAt')
			.lean();
		return categories;
	}

	async getCategoryById(id: string) {
		if (id) {
			const category = await this.model.findById(id);
			logger.debug(`Found category: ${JSON.stringify(category)}`);
			return category;
		}
		return null;
	}
	async getCategoryByName(name: string) {
		logger.debug(`Fetching category with name: ${name}`);
		if (name) {
			const category = await this.model.find({ name });
			logger.debug(`Found categories: ${JSON.stringify(category)}`);
			return category;
		}
		return null;
	}
	async createCategory(categoryData: Category) {
		return await this.model.create(categoryData);
	}
	async updateCategory(id: string, categoryData: Partial<Category>) {
		if (id) {
			const updatedCategory = await this.model.findByIdAndUpdate(
				id,
				categoryData,
				{ new: true }
			);
			logger.debug(
				`Updated category with ID ${id}: ${JSON.stringify(
					updatedCategory
				)}`
			);
			return updatedCategory;
		}
		return null;
	}

	async deleteCategory(id: string) {
		if (id) {
			const deletedCategory = await this.model.findByIdAndDelete(id);
			logger.debug(
				`Deleted category with ID ${id}: ${JSON.stringify(
					deletedCategory
				)}`
			);
			return deletedCategory;
		}
		return null;
	}
}
