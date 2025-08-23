import mongoose from 'mongoose';
import logger from '../config/logger';
import { CategoryService } from './CategoryService';
import { PriceType } from './types';
import type { Attribute, PriceConfiguration } from './types';
import { body, param } from 'express-validator';

const priceTypeValues = [
	PriceType.BASE,
	PriceType.ADDITIONAL,
	PriceType.DISCOUNT,
];

const validateName = (isOptional = false) =>
	body('name')
		.optional({ checkFalsy: isOptional })
		.matches(/^[a-zA-Z0-9\s]+$/)
		.withMessage('Name can only contain alphanumeric characters and spaces')
		.isLength({ min: 3, max: 100 })
		.withMessage('Name must be between 3 and 100 characters long')
		.custom(async (name: string) => {
			const categoryService = new CategoryService();
			const existingCategory =
				await categoryService.getCategoryByName(name);
			logger.debug(
				`Checking for existing category with name: ${JSON.stringify(existingCategory)}`
			);
			if (existingCategory && existingCategory.length > 0) {
				throw new Error('Category with this name already exists');
			}
			return true;
		});

const validatePriceConfiguration = (isOptional = false) =>
	body('priceConfiguration')
		.optional({ checkFalsy: isOptional })
		.isObject()
		.withMessage('Price configuration must be an object')
		.custom((value: PriceConfiguration) => {
			if (!Object.keys(value).length && !isOptional) {
				throw new Error('Price configuration cannot be empty');
			}
			for (const key in value) {
				const config = value[key];
				if (
					!config.priceType ||
					!priceTypeValues.includes(config.priceType)
				) {
					throw new Error(`Invalid price type for key ${key}`);
				}
				if (
					!Array.isArray(config.availableOptions) ||
					config.availableOptions.length === 0
				) {
					throw new Error(
						`Available options must be a non-empty array for key ${key}`
					);
				}
				config.availableOptions = config.availableOptions.map(String);
			}
			return true;
		});

const validateAttributes = (isOptional = false) =>
	body('attributes')
		.optional({ checkFalsy: isOptional })
		.isArray()
		.withMessage('Attributes must be an array')
		.custom((value: Attribute[]) => {
			if (!value.length && !isOptional) {
				throw new Error('Attributes cannot be empty');
			}
			value.forEach((attr, index) => {
				if (!attr.name || typeof attr.name !== 'string') {
					throw new Error(
						`Attribute at index ${index} must have a valid name`
					);
				}
				if (!['radio', 'switch'].includes(attr.widgetType)) {
					throw new Error(
						`Invalid widget type for attribute at index ${index}`
					);
				}
				if (
					!Array.isArray(attr.availableOptions) ||
					attr.availableOptions.length === 0
				) {
					throw new Error(
						`Available options must be a non-empty array for attribute at index ${index}`
					);
				}
				attr.availableOptions = attr.availableOptions.map(String);

				if (
					attr.defaultValue === undefined ||
					attr.defaultValue === null
				) {
					throw new Error(
						`Attribute at index ${index} must have a default value`
					);
				}
				if (typeof attr.defaultValue !== 'string') {
					attr.defaultValue = String(attr.defaultValue);
				}
				if (!attr.availableOptions.includes(attr.defaultValue)) {
					throw new Error(
						`Default value for attribute at index ${index} must be one of the available options`
					);
				}
			});
			return true;
		});

export const categoryParamValidator = [
	param('id').custom((value: string) => {
		if (!mongoose.Types.ObjectId.isValid(value)) {
			throw new Error('Invalid category ID');
		}
		return true;
	}),
];

export const createCategoryValidator = [
	validateName(false),
	validatePriceConfiguration(false),
	validateAttributes(false),
];

export const updateCategoryValidator = [
	validateName(true),
	validatePriceConfiguration(true),
	validateAttributes(true),
];
