import { Response, Request } from 'express';
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

	async getById(req: Request, res: Response) {
		const categoryId = req.params.id;
		logger.info(`Fetching category with ID: ${categoryId}`);

		try {
			const category: Category | null =
				await this.categoryService.getCategoryById(categoryId);

			if (!category) {
				logger.warn(`Category not found with ID: ${categoryId}`);
				return res.status(404).json({
					message: 'Category not found',
					success: false,
				});
			}

			logger.info(`Category found with ID: ${categoryId}`);
			return res.status(200).json({
				success: true,
				data: new CategoryDto(category),
			});
		} catch (error) {
			logger.error(`Error fetching category with ID: ${categoryId}`, {
				error,
			});
			return res.status(500).json({
				message: 'Internal server error while fetching category',
			});
		}
	}

	async updateCategory(req: CategoryUpdateRequest, res: Response) {
		const categoryId = req.params.id;
		const updateData = req.body;
		logger.info(`Updating category with ID: ${categoryId}`);

		try {
			const updatedCategory: Category | null =
				await this.categoryService.updateCategory(
					categoryId,
					updateData
				);

			if (!updatedCategory) {
				logger.warn(
					`Category not found for update with ID: ${categoryId}`
				);
				return res.status(404).json({
					message: 'Category not found',
					success: false,
				});
			}

			logger.info(`Category updated successfully with ID: ${categoryId}`);
			return res.status(200).json({
				message: 'Category updated successfully',
				success: true,
				data: new CategoryDto(updatedCategory),
			});
		} catch (error) {
			logger.error(`Error updating category with ID: ${categoryId}`, {
				error,
			});
			return res.status(500).json({
				message: 'Internal server error while updating category',
			});
		}
	}

	async deleteCategory(req: Request, res: Response) {
		const categoryId = req.params.id;
		logger.info(`Deleting category with ID: ${categoryId}`);

		try {
			const deleted =
				await this.categoryService.deleteCategory(categoryId);

			if (!deleted) {
				logger.warn(
					`Category not found for deletion with ID: ${categoryId}`
				);
				return res.status(404).json({
					message: 'Category not found',
					success: false,
				});
			}

			logger.info(`Category deleted successfully with ID: ${categoryId}`);
			return res.status(200).json({
				message: 'Category deleted successfully',
				success: true,
			});
		} catch (error) {
			logger.error(`Error deleting category with ID: ${categoryId}`, {
				error,
			});
			return res.status(500).json({
				message: 'Internal server error while deleting category',
			});
		}
	}
}
