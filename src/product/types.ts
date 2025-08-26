import { Types } from 'mongoose';
import { Request } from 'express';
export type PriceType = 'base' | 'additional';

export interface PriceConfiguration {
	priceType: PriceType;
	availableOptions: Map<string, number>;
}

export interface Attribute {
	name: string;
	value: string | number | boolean;
}

export interface Product {
	_id: Types.ObjectId;
	name: string;
	description: string;
	imageUrl: string;
	priceConfiguration: Map<string, PriceConfiguration>;
	attributes: Attribute[];
	tenantId: string;
	categoryId: Types.ObjectId;
	isPublished: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export interface ProductCreateRequest extends Request {
	body: { data: Product }; // JSON string containing product details
}

export interface ProductUpdateRequest extends Request {
	body: {
		data: Partial<
			Omit<
				Product,
				'_id' | 'createdAt' | 'updatedAt' | 'tenantId' | 'categoryId'
			>
		>;
	};
}
