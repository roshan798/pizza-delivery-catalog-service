import { Request } from 'express';
export enum PriceType {
	BASE = 'base',
	DISCOUNT = 'discount',
	ADDITIONAL = 'additional',
}
export interface PriceConfiguration {
	[key: string]: {
		priceType: PriceType;
		availableOptions: string[];
		// defaultOption: string;
	};
}
export interface Attribute {
	name: string;
	widgetType: 'radio' | 'switch';
	defaultValue: string;
	availableOptions: string[];
}
export interface Category {
	id?: string;
	name: string;
	priceConfiguration: PriceConfiguration;
	attributes: Attribute[];
}

export interface CategoryCreateRequest extends Request {
	body: Category;
}
