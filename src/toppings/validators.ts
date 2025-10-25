import { UploadedFile } from 'express-fileupload';
import { body } from 'express-validator';
import createHttpError from 'http-errors';
import config from 'config';
import { validateTenantId } from '../product/productValidator';

const MAX_FILE_SIZE: number =
	config.get('storage.maxUploadSize') || 2 * 1024 * 1024; // 2MB

const validateName = (isOptional = false) => {
	return body('name')
		.optional({ checkFalsy: isOptional })
		.isString()
		.withMessage('Name must be a string')
		.isLength({ min: 3 })
		.withMessage('Name cannot be empty');
};

const validatePrice = (isOptional = false) => {
	return body('price')
		.optional({ checkFalsy: isOptional })
		.isFloat({ gt: 0 })
		.withMessage('Price must be a number greater than 0');
};
const validateImageFile = (isOptional = false) =>
	body('image').custom((value, { req }) => {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		const file = req.files?.image as UploadedFile;
		if (!file && !isOptional) {
			throw new createHttpError.BadRequest('Topping image is required');
		}

		if (file) {
			// allowed mime types
			const allowedMimes = [
				'image/jpeg',
				'image/png',
				'image/jpg',
				'image/webp',
			];
			if (!allowedMimes.includes(file.mimetype)) {
				throw new createHttpError.BadRequest(
					'Invalid image type. Only jpeg, png, jpg, webp allowed'
				);
			}

			if (file.size > MAX_FILE_SIZE) {
				throw new createHttpError.BadRequest(
					'Image must be less than 5MB'
				);
			}
		}
		return true;
	});

export const createToppingValidator = [
	validateName(false),
	validatePrice(false),
	validateImageFile(false),
	validateTenantId(false),
];

export const updateToppingValidator = [
	validateName(true),
	validatePrice(true),
	validateImageFile(true),
];
