import mongoose from 'mongoose';
import { body, param } from 'express-validator';
import type { Attribute, PriceConfiguration } from './types';

export enum PriceType {
	BASE = 'base',
	ADDITIONAL = 'additional',
}
const priceTypeValues: PriceType[] = [PriceType.BASE, PriceType.ADDITIONAL];

const validateName = (isOptional = false) =>
	body('name')
		.optional({ checkFalsy: isOptional })
		.isString()
		.isLength({ min: 3, max: 100 })
		.withMessage('Name must be between 3 and 100 characters long');

const validateDescription = (isOptional = false) =>
	body('description')
		.optional({ checkFalsy: isOptional })
		.isString()
		.isLength({ min: 10, max: 1000 })
		.withMessage('Description must be between 10 and 1000 characters long');

const validateImageUrl = (isOptional = false) =>
	body('imageUrl')
		.optional({ checkFalsy: isOptional })
		.isURL()
		.withMessage('Image URL must be a valid URL');

const validateTenantId = (isOptional = false) =>
	body('tenantId')
		.optional({ checkFalsy: isOptional })
		.isString()
		.notEmpty()
		.withMessage('Tenant ID is required');

const validateCategoryId = (isOptional = false) =>
	body('categoryId')
		.optional({ checkFalsy: isOptional })
		.custom((value: string) => {
			if (!mongoose.Types.ObjectId.isValid(value)) {
				throw new Error('Invalid category ID');
			}
			return true;
		});

/**
 * Validate a single PriceConfiguration entry
 */
const validateConfigEntry = (config: PriceConfiguration, key: string): void => {
	if (
		!config.priceType ||
		!priceTypeValues.includes(config.priceType as PriceType)
	) {
		throw new Error(`Invalid or missing priceType for key "${key}"`);
	}

	if (
		!config.availableOptions ||
		!(config.availableOptions instanceof Map) ||
		config.availableOptions.size === 0
	) {
		throw new Error(
			`availableOptions must be a non-empty Map<string, number> for key "${key}"`
		);
	}

	for (const [optKey, optVal] of config.availableOptions.entries()) {
		if (typeof optKey !== 'string') {
			throw new Error(
				`Option key in availableOptions must be a string for key "${key}"`
			);
		}
		if (typeof optVal !== 'number' || isNaN(optVal)) {
			throw new Error(
				`Option value in availableOptions must be a valid number for key "${key}"`
			);
		}
	}
};

export const validatePriceConfiguration = (isOptional = false) =>
	body('priceConfiguration')
		.optional({ checkFalsy: isOptional })
		.isObject()
		.withMessage('priceConfiguration must be an object')
		.custom((value: Record<string, PriceConfiguration>) => {
			if (!value || (!Object.keys(value).length && !isOptional)) {
				throw new Error('priceConfiguration cannot be empty');
			}

			for (const key of Object.keys(value)) {
				validateConfigEntry(value[key], key);
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
				if (
					attr.value === undefined ||
					!['string', 'number', 'boolean'].includes(typeof attr.value)
				) {
					throw new Error(
						`Attribute at index ${index} must have a valid value (string, number, or boolean)`
					);
				}
			});
			return true;
		});

// --- Exported validators ---

export const productParamValidator = [
	param('id').custom((value: string) => {
		if (!mongoose.Types.ObjectId.isValid(value)) {
			throw new Error('Invalid product ID');
		}
		return true;
	}),
];

export const createProductValidator = [
	validateName(false),
	validateDescription(false),
	validateImageUrl(false),
	validateTenantId(false),
	validateCategoryId(false),
	validatePriceConfiguration(false),
	validateAttributes(false),
];

export const updateProductValidator = [
	validateName(true),
	validateDescription(true),
	validateImageUrl(true),
	validateTenantId(true),
	validateCategoryId(true),
	validatePriceConfiguration(true),
	validateAttributes(true),
];
