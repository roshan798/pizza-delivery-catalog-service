import express, { Request, Response } from 'express';
import { CategoryController } from './CategoryController';
import {
	categoryParamValidator,
	createCategoryValidator,
	updateCategoryValidator,
} from './categoryValidator';
import expressValidatorErrorHandler from '../common/validationErrorHandler';
import { CategoryService } from './CategoryService';
import categoryModel from './categoryModel';
import asyncRequestHandler from '../utils/asyncRequestHandler';

const router = express.Router();

const service = new CategoryService(categoryModel);
const controller = new CategoryController(service);

// --- Routes ---
router.get(
	'/',
	asyncRequestHandler(async (req: Request, res: Response) => {
		await controller.getAll(req, res);
	})
);

router.get(
	'/:id',
	categoryParamValidator,
	expressValidatorErrorHandler,
	asyncRequestHandler(async (req: Request, res: Response) => {
		await controller.getById(req, res);
	})
);

router.post(
	'/',
	createCategoryValidator,
	expressValidatorErrorHandler,
	asyncRequestHandler(async (req: Request, res: Response) => {
		await controller.createCategory(req, res);
	})
);

router.put(
	'/:id',
	categoryParamValidator,
	updateCategoryValidator,
	expressValidatorErrorHandler,
	asyncRequestHandler(async (req: Request, res: Response) => {
		await controller.updateCategory(req, res);
	})
);

router.delete(
	'/:id',
	categoryParamValidator,
	expressValidatorErrorHandler,
	asyncRequestHandler(async (req: Request, res: Response) => {
		await controller.deleteCategory(req, res);
	})
);

export default router;
