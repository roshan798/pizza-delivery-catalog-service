import { Response, Request } from 'express';
import { Category, CategoryCreateRequest } from './types';
import { CategoryService } from './CategoryService';
import logger from '../config/logger';
import { CategoryDto } from './CategoryDto';

export class CategoryController {
	constructor(private readonly categoryService: CategoryService) {}

	async createCategory(req: CategoryCreateRequest, res: Response) {
		logger.info('Entering createCategory controller');

		try {
			const categoryData = req.body;

			if (!categoryData) {
				logger.warn('Category creation failed: No data provided');
				return res
					.status(400)
					.json({ message: 'Category data is required' });
			}

			const newCategory: Category =
				await this.categoryService.createCategory(categoryData);

			logger.info(
				`Category created successfully with ID: ${newCategory._id}`
			);

			return res.status(201).json({
				message: 'Category created successfully',
				categoryId: newCategory._id!,
			});
		} catch (error) {
			logger.error('Error creating category', { error });
			return res.status(500).json({
				message: 'Internal server error while creating category',
			});
		}
	}

	async getAll(req: Request, res: Response) {
		logger.info('Fetching all categories');

		try {
			const categories: Category[] =
				await this.categoryService.getAllCategories();

			logger.info(`Fetched ${categories.length} categories`);

			return res.status(200).json({
				success: true,
				data: CategoryDto.fromMany(categories),
			});
		} catch (error) {
			logger.error('Error fetching categories', { error });
			return res.status(500).json({
				message: 'Internal server error while fetching categories',
			});
		}
	}
}
