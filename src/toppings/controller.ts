import { Request, Response } from 'express';
import { ToppingService } from './service';
import logger from '../config/logger';
import { AuthinticateRequestWithImage, Roles } from '../common/types';
import { Topping } from './types';
import createHttpError from 'http-errors';
import { UploadedFile } from 'express-fileupload';
import { v4 as uuidv4 } from 'uuid';
import { FileStorage } from '../common/types/storage';
import ToppingDto from './Dto';

export class ToppingController {
	constructor(
		private readonly toppingService: ToppingService,
		private readonly storage: FileStorage
	) {}
	async getAllToppings(_req: Request, res: Response) {
		logger.info('Fetching all toppings');
		const toppings = await this.toppingService.getAllToppings();
		logger.info(`Fetched ${toppings.length} toppings`);
		return res.status(200).json({
			success: true,
			data: toppings.map((topping) => new ToppingDto(topping)),
		});
	}

	async getToppingById(req: Request, res: Response) {
		const toppingId = req.params.id;
		logger.info(`Fetching topping with ID: ${toppingId}`);
		if (!toppingId) {
			logger.warn('Topping ID is missing in request parameters');
			return res.status(400).json({
				success: false,
				message: 'Topping ID is required',
			});
		}
		const topping = await this.toppingService.getToppingById(toppingId);
		if (!topping) {
			logger.warn(`Topping with ID: ${req.params.id} not found`);
			return res.status(404).json({
				success: false,
				message: 'Topping not found',
			});
		}
		logger.info(`Fetched topping with ID: ${req.params.id}`);
		return res.status(200).json({
			success: true,
			data: new ToppingDto(topping),
		});
	}

	async create(_req: Request, res: Response) {
		logger.info('Entering into create method of ToppingController');
		const req = _req as AuthinticateRequestWithImage<Partial<Topping>>;
		let toppingData = req.body;
		if (typeof toppingData === 'string') {
			try {
				toppingData = JSON.parse(toppingData) as Topping;
			} catch (err) {
				if (err instanceof Error) {
					logger.error(`Topping creation failed: ${err.message}`);
				}
				logger.warn('Topping creation failed: Invalid JSON in data');
				throw new createHttpError.BadRequest('Invalid JSON in data');
			}
		}
		if (!toppingData) {
			logger.warn('Topping creation failed: No data provided');
			throw new createHttpError.BadRequest('Topping data is required');
		}
		// tenantId from auth for managers
		if (req.auth.role === 'manager') {
			if (!req.auth.tenantId) {
				logger.error(
					'Topping creation failed: Tenant ID missing in auth'
				);
				throw new createHttpError.InternalServerError(
					'Tenant ID is missing in auth'
				);
			}
			toppingData.tenantId = req.auth?.tenantId;
			logger.info(
				`Manager detected, forcing tenantId=${toppingData.tenantId}`
			);
		}
		const imageFile = req.files?.image as UploadedFile;
		if (!imageFile) {
			logger.warn('No image file provided for Topping creation');
			throw new createHttpError.BadRequest('Topping image is required');
		}

		toppingData.image = imageFile.name;
		const mime = imageFile.mimetype;
		const ext = mime.split('/')[1];
		const imageName = uuidv4() + '-t' + '.' + ext;

		await this.storage.upload({
			name: imageName,
			data: imageFile.data.buffer,
		});
		toppingData.image = this.storage.getObjectUri(imageName);
		const newTopping = await this.toppingService.createTopping(toppingData);
		logger.info(`Topping created with ID: ${newTopping._id}`);
		res.json({
			success: true,
			id: newTopping._id,
		});
	}
	async update(_req: Request, res: Response) {
		logger.info('Entering into update method of ToppingController');
		const req = _req as AuthinticateRequestWithImage<
			Partial<Topping> | string
		>;

		// Safely parse body which may be JSON string or object
		let toppingData: Partial<Topping> | undefined;
		if (typeof req.body === 'string') {
			try {
				toppingData = JSON.parse(req.body) as Partial<Topping>;
			} catch (err) {
				if (err instanceof Error) {
					logger.error(`Topping updation failed: ${err.message}`);
				}
				logger.warn('Topping updation failed: Invalid JSON in data');
				throw new createHttpError.BadRequest('Invalid JSON in data');
			}
		} else {
			toppingData = req.body as Partial<Topping> | undefined;
		}

		// determine topping id from route params first, fallback to body.id
		const toppingId =
			(req.params && req.params.id) || (toppingData && toppingData.id);

		if (!toppingId) {
			logger.warn('Topping updation failed: No topping id provided');
			throw new createHttpError.BadRequest('Topping id is required');
		}

		// Fetch existing topping and perform tenant ownership check for managers
		const existingTopping = await this.toppingService.getToppingById(
			String(toppingId)
		);
		if (!existingTopping) {
			throw new createHttpError.NotFound('Topping not found');
		}
		if (req.auth.role === Roles.MANAGER) {
			if (req.auth.tenantId !== existingTopping?.tenantId) {
				throw new createHttpError.Forbidden(
					'You are not authorised to update this Topping.'
				);
			}
		}

		if (!toppingData) {
			logger.warn('Topping updation failed: No data provided');
			throw new createHttpError.BadRequest('Topping data is required');
		}
		const imageFile = req.files?.image as UploadedFile;
		const { name, price } = toppingData;
		if (!name && !imageFile && !price) {
			logger.warn(
				'Topping updation failed: No fields to update provided'
			);
			throw new createHttpError.BadRequest(
				'At least one field (name, price, image) is required to update'
			);
		}
		if (imageFile) {
			// Handle new image: upload first, then delete the previous image (mirror product update behavior)
			logger.info('Image file provided for Topping updation');
			const mime = imageFile.mimetype;
			const ext = mime.split('/')[1];
			const imageName = uuidv4() + '-t' + '.' + ext;

			try {
				await this.storage.upload({
					name: imageName,
					data: imageFile.data.buffer,
				});
				const newImageUrl = this.storage.getObjectUri(imageName);

				// Delete old image from storage if present
				if (existingTopping.image) {
					try {
						await this.storage.delete(existingTopping.image);
						logger.info('Old topping image deleted from storage');
					} catch (err) {
						logger.error(
							`Failed to delete old topping image: ${(err as Error).message}`
						);
					}
				}

				toppingData.image = newImageUrl;
			} catch (err) {
				logger.error(
					`Topping image upload failed: ${(err as Error).message}`
				);
				// fallback to previous image
				toppingData.image = existingTopping.image;
			}
		}

		// Update the topping
		const updated = await this.toppingService.updateTopping(
			String(toppingId),
			toppingData
		);
		if (!updated) {
			throw new createHttpError.NotFound('Topping not found');
		}
		logger.info(`Topping updated with ID: ${updated._id}`);
		res.json({
			success: true,
			data: new ToppingDto(updated as Topping),
		});
	}

	async delete(_req: Request, res: Response) {
		const req = _req as Request & {
			params: { id: string };
			auth: { role?: string; tenantId?: string };
		};
		const id = req.params.id;
		if (!id) {
			throw new createHttpError.BadRequest('Topping id is required');
		}
		// tenant check for manager
		if (req.auth?.role === Roles.MANAGER) {
			const topping = await this.toppingService.getToppingById(id);
			if (topping?.tenantId !== req.auth.tenantId) {
				throw new createHttpError.Forbidden(
					'You are not authorised to delete this topping.'
				);
			}
		}

		// delete the image from storage
		const topping = await this.toppingService.getToppingById(id);
		if (topping?.image) {
			try {
				await this.storage.delete(topping.image);
				logger.info('Topping image deleted from storage');
			} catch (err) {
				logger.error(
					`Failed to delete topping image: ${(err as Error).message}`
				);
			}
		}

		//
		const deleted = await this.toppingService.deleteTopping(id);
		if (!deleted) {
			throw new createHttpError.NotFound('Topping not found');
		}

		res.json({ success: true, message: 'Topping deleted successfully' });
	}
}
