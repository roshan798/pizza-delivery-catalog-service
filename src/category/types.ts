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
	_id?: string;
	name: string;
	widgetType: 'radio' | 'switch';
	defaultValue: string;
	availableOptions: string[];
}
export interface Category {
	_id?: string;
	name: string;
	priceConfiguration: PriceConfiguration;
	attributes: Attribute[];
	createdAt?: Date;
	updatedAt?: Date;
}
export type CategoryListItem = Omit<
	Category,
	'priceConfiguration' | 'attributes'
>;

export interface CategoryCreateRequest extends Request {
	body: Category;
}
export interface CategoryUpdateRequest extends Request {
	body: Partial<Category>;
}
