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
const router = express.Router();

const service = new CategoryService(categoryModel);
const controller = new CategoryController(service);

router.get('/', async (req: Request, res: Response) => {
	await controller.getAll(req, res);
});

router.get(
	'/:id',
	categoryParamValidator,
	expressValidatorErrorHandler,
	async (req: Request, res: Response) => {
		await controller.getById(req, res);
	}
);

router.post(
	'/',
	createCategoryValidator,
	expressValidatorErrorHandler,
	async (req: Request, res: Response) => {
		await controller.createCategory(req, res);
	}
);

router.put(
	'/:id',
	categoryParamValidator,
	updateCategoryValidator,
	expressValidatorErrorHandler,
	async (req: Request, res: Response) => {
		await controller.updateCategory(req, res);
	}
);
router.delete(
	'/:id',
	categoryParamValidator,
	expressValidatorErrorHandler,
	async (req: Request, res: Response) => {
		await controller.deleteCategory(req, res);
	}
);

export default router;
