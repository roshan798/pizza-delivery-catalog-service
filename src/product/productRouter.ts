import express, { Request, Response } from 'express';
import { ProductController } from './productController';
import { ProductService } from './productService';
import productModel from './productModel';
import asyncRequestHandler from '../utils/asyncRequestHandler';
import authenticate from '../common/middlewares/authenticate';
import canAccess from '../common/middlewares/canAccess';
import { Roles } from '../common/types';

const router = express.Router();

const service = new ProductService(productModel);
const controller = new ProductController(service);

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
	canAccess([Roles.ADMIN]),
	asyncRequestHandler(async (req: Request, res: Response) => {
		await controller.createProduct(req, res);
	})
);

router.put(
	'/:id',
	authenticate,
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
