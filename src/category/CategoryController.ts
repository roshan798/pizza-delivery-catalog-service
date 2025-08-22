import { Response } from 'express';
import { Category, CategoryCreateRequest } from './types';
import { CategoryService } from './CategoryService';

export class CategoryController {
	constructor(private readonly categoryService: CategoryService) {}
	async createCategory(req: CategoryCreateRequest, res: Response) {
		const categoryData = req.body;
		if (!categoryData) {
			return res
				.status(400)
				.json({ message: 'Category data is required' });
		}
		const newCategory: Category =
			await this.categoryService.createCategory(categoryData);
		res.status(201).json({
			message: 'Category created successfully',
			categoryId: newCategory.id,
		});
	}
}
