import express, { Request, Response } from 'express';
import { CategoryController } from './CategoryController';
import categoryValidator from './categoryValidator';
import expressValidatorErrorHandler from '../common/validationErrorHandler';
import { CategoryService } from './CategoryService';
import categoryModel from './categoryModel';
const router = express.Router();

const service = new CategoryService(categoryModel);
const controller = new CategoryController(service);
router.post(
	'/',
	categoryValidator,
	expressValidatorErrorHandler,
	async (req: Request, res: Response) => {
		await controller.createCategory(req, res);
	}
);
export default router;
