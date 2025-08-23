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
import authenticate from '../common/middlewares/authenticate';
import canAccess from '../common/middlewares/canAccess';
import { Roles } from '../common/types';

const router = express.Router();

const service = new CategoryService(categoryModel);
const controller = new CategoryController(service);

// --- Routes ---
router.get(
	'/',
	authenticate,
	canAccess([Roles.ADMIN]),
	asyncRequestHandler(async (req: Request, res: Response) => {
		await controller.getAll(req, res);
	})
);

router.get(
	'/:id',
	authenticate,
	canAccess([Roles.ADMIN]),
	categoryParamValidator,
	expressValidatorErrorHandler,
	asyncRequestHandler(async (req: Request, res: Response) => {
		await controller.getById(req, res);
	})
);

router.post(
	'/',
	authenticate,
	canAccess([Roles.ADMIN]),
	createCategoryValidator,
	expressValidatorErrorHandler,
	asyncRequestHandler(async (req: Request, res: Response) => {
		await controller.createCategory(req, res);
	})
);

router.put(
	'/:id',
	authenticate,
	canAccess([Roles.ADMIN]),
	categoryParamValidator,
	updateCategoryValidator,
	expressValidatorErrorHandler,
	asyncRequestHandler(async (req: Request, res: Response) => {
		await controller.updateCategory(req, res);
	})
);

router.delete(
	'/:id',
	authenticate,
	canAccess([Roles.ADMIN]),
	categoryParamValidator,
	expressValidatorErrorHandler,
	asyncRequestHandler(async (req: Request, res: Response) => {
		await controller.deleteCategory(req, res);
	})
);

export default router;
