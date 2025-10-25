import express, { Request, Response } from 'express';
import { ToppingController } from './controller';
import asyncRequestHandler from '../utils/asyncRequestHandler';
import { ToppingService } from './service';
import authenticate from '../common/middlewares/authenticate';
import canAccess from '../common/middlewares/canAccess';
import { Roles } from '../common/types';
import expressValidatorErrorHandler from '../common/validationErrorHandler';
import { S3Storage } from '../common/services/S3Storage';
import fileUpload from 'express-fileupload';
import { fileUploadOptions, parseData } from '../utils/utils';
import { createToppingValidator, updateToppingValidator } from './validators';
const router = express.Router();
const toppingService = new ToppingService();
const s3storage = new S3Storage();
const toppingController = new ToppingController(toppingService, s3storage);
router.get(
	'/',
	asyncRequestHandler(async (req: Request, res: Response) => {
		await toppingController.getAllToppings(req, res);
	})
);

router.get(
	'/:id',
	asyncRequestHandler(async (req: Request, res: Response) => {
		await toppingController.getToppingById(req, res);
	})
);

router.post(
	'/',
	authenticate,
	canAccess([Roles.ADMIN, Roles.MANAGER]),
	fileUpload(fileUploadOptions),
	parseData,
	createToppingValidator,
	expressValidatorErrorHandler,
	async (req: Request, res: Response) => {
		await toppingController.create(req, res);
	}
);
router.put(
	'/:id',
	authenticate,
	canAccess([Roles.ADMIN, Roles.MANAGER]),
	fileUpload(fileUploadOptions),
	parseData,
	updateToppingValidator,
	expressValidatorErrorHandler,
	async (req: Request, res: Response) => {
		await toppingController.update(req, res);
	}
);

router.delete(
	'/:id',
	authenticate,
	canAccess([Roles.ADMIN, Roles.MANAGER]),
	async (req: Request, res: Response) => {
		await toppingController.delete(req, res);
	}
);

export default router;
