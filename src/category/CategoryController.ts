import { Response, Request } from 'express';
import createHttpError from 'http-errors';
import {
	Category,
	CategoryCreateRequest,
	CategoryUpdateRequest,
} from './types';
import { CategoryService } from './CategoryService';
import logger from '../config/logger';
import { CategoryDto } from './CategoryDto';

export class CategoryController {
	constructor(private readonly categoryService: CategoryService) {}

	async createCategory(req: CategoryCreateRequest, res: Response) {
		logger.info('Entering createCategory controller');

		const categoryData = req.body;
		if (!categoryData) {
			logger.warn('Category creation failed: No data provided');
			throw new createHttpError.BadRequest('Category data is required');
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
	}

	async getAll(req: Request, res: Response) {
		logger.info('Fetching all categories');

		const categories: Category[] =
			await this.categoryService.getAllCategories();

		logger.info(`Fetched ${categories.length} categories`);

		return res.status(200).json({
			success: true,
			data: CategoryDto.fromMany(categories),
		});
	}

	async getById(req: Request, res: Response) {
		const categoryId = req.params.id;
		logger.info(`Fetching category with ID: ${categoryId}`);

		const category: Category | null =
			await this.categoryService.getCategoryById(categoryId);

		if (!category) {
			logger.warn(`Category not found with ID: ${categoryId}`);
			throw new createHttpError.NotFound('Category not found');
		}

		logger.info(`Category found with ID: ${categoryId}`);
		return res.status(200).json({
			success: true,
			data: new CategoryDto(category),
		});
	}

	async updateCategory(req: CategoryUpdateRequest, res: Response) {
		const categoryId = req.params.id;
		const updateData = req.body;
		logger.info(`Updating category with ID: ${categoryId}`);

		const updatedCategory: Category | null =
			await this.categoryService.updateCategory(categoryId, updateData);

		if (!updatedCategory) {
			logger.warn(`Category not found for update with ID: ${categoryId}`);
			throw new createHttpError.NotFound('Category not found');
		}

		logger.info(`Category updated successfully with ID: ${categoryId}`);
		return res.status(200).json({
			message: 'Category updated successfully',
			success: true,
			data: new CategoryDto(updatedCategory),
		});
	}

	async deleteCategory(req: Request, res: Response) {
		const categoryId = req.params.id;
		logger.info(`Deleting category with ID: ${categoryId}`);

		const deleted = await this.categoryService.deleteCategory(categoryId);

		if (!deleted) {
			logger.warn(
				`Category not found for deletion with ID: ${categoryId}`
			);
			throw new createHttpError.NotFound('Category not found');
		}

		logger.info(`Category deleted successfully with ID: ${categoryId}`);
		return res.status(200).json({
			message: 'Category deleted successfully',
			success: true,
		});
	}
}
