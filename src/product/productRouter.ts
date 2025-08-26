import express, { Request, Response } from 'express';
import { ProductController } from './productController';
import { ProductService } from './productService';
import productModel from './productModel';
import asyncRequestHandler from '../utils/asyncRequestHandler';
import authenticate from '../common/middlewares/authenticate';
import canAccess from '../common/middlewares/canAccess';
import { Roles } from '../common/types';
import fileUpload from 'express-fileupload';
import {
	createProductValidator,
	productParamValidator,
	updateProductValidator,
} from './productValidator';
import { S3Storage } from '../common/services/S3Storage';
import expressValidatorErrorHandler from '../common/validationErrorHandler';
import { fileUploadOptions, parseData } from './productUtils';

const router = express.Router();

const service = new ProductService(productModel);
const s3Storage = new S3Storage();
const controller = new ProductController(service, s3Storage);

// --- Routes ---
router.get(
	'/',
	asyncRequestHandler(async (req: Request, res: Response) => {
		await controller.getAll(req, res);
	})
);

router.get(
	'/:id',
	productParamValidator,
	expressValidatorErrorHandler,
	asyncRequestHandler(async (req: Request, res: Response) => {
		await controller.getById(req, res);
	})
);

router.post(
	'/',
	authenticate,
	canAccess([Roles.ADMIN]),
	fileUpload(fileUploadOptions),
	parseData,
	createProductValidator,
	expressValidatorErrorHandler,
	asyncRequestHandler(async (req: Request, res: Response) => {
		await controller.createProduct(req, res);
	})
);

router.put(
	'/:id',
	authenticate,
	canAccess([Roles.ADMIN]),
	fileUpload(fileUploadOptions),
	parseData,
	productParamValidator,
	updateProductValidator,
	expressValidatorErrorHandler,
	asyncRequestHandler(async (req: Request, res: Response) => {
		await controller.updateProduct(req, res);
	})
);

router.delete(
	'/:id',
	authenticate,
	canAccess([Roles.ADMIN]),
	productParamValidator,
	expressValidatorErrorHandler,
	asyncRequestHandler(async (req: Request, res: Response) => {
		await controller.deleteProduct(req, res);
	})
);

export default router;
