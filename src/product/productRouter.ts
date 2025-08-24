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
import createHttpError from 'http-errors';
import config from 'config';

const router = express.Router();
const MAX_FILE_SIZE: number =
	config.get('storage.maxUploadSize') || 2 * 1024 * 1024; // 2MB
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
	asyncRequestHandler(async (req: Request, res: Response) => {
		await controller.getById(req, res);
	})
);

router.post(
	'/',
	authenticate,
	fileUpload({
		limits: { fileSize: MAX_FILE_SIZE },
		abortOnLimit: true,
		responseOnLimit: 'File size limit has been reached',
		limitHandler: (req, res, next) => {
			const err = createHttpError(
				413,
				'File size limit has been reached'
			);
			next(err);
		},
	}),
	createProductValidator,
	canAccess([Roles.ADMIN]),
	asyncRequestHandler(async (req: Request, res: Response) => {
		await controller.createProduct(req, res);
	})
);

router.put(
	'/:id',
	authenticate,
	productParamValidator,
	updateProductValidator,
	canAccess([Roles.ADMIN]),
	asyncRequestHandler(async (req: Request, res: Response) => {
		await controller.updateProduct(req, res);
	})
);

router.delete(
	'/:id',
	authenticate,
	canAccess([Roles.ADMIN]),
	asyncRequestHandler(async (req: Request, res: Response) => {
		await controller.deleteProduct(req, res);
	})
);

export default router;
