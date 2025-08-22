import { Category } from './types';
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

	async getCategoryByName(name: string) {
		logger.debug(`Fetching category with name: ${name}`);
		if (name) {
			const category = await this.model.find({ name });
			logger.debug(`Found categories: ${JSON.stringify(category)}`);
			return category;
		}
		return null;
	}
	getCategoryById(id: string) {
		// Logic to retrieve a category by ID
		if (id) {
			return { id, name: 'Sample Category' }; // Example response
		}
		return null;
	}
	async createCategory(categoryData: Category) {
		return await this.model.create(categoryData);
	}
	// updateCategory(id: string, categoryData: any) {
	//     // Logic to update an existing category
	//     return { id, ...categoryData };
	// }
	deleteCategory(id: string) {
		// Logic to delete a category
		return { id, deleted: true };
	}
	// Additional methods can be added as needed
	// For example, methods for searching categories, filtering, etc.
	// This is a placeholder for the actual implementation
}
