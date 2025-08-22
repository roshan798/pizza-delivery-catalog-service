import { Category } from './types';

export class CategoryDto {
	id: string;
	name: string;
	priceConfiguration;
	attributes: AttributeDto[];
	createdAt: Date;
	updatedAt: Date;

	constructor(category: Category) {
		this.id = category._id!;
		this.name = category.name;
		this.priceConfiguration = category.priceConfiguration;
		this.attributes = category.attributes.map(
			(attr) => new AttributeDto(attr)
		);

		this.createdAt = category.createdAt!;
		this.updatedAt = category.updatedAt!;
	}

	static fromMany(categories: Category[]): CategoryDto[] {
		return categories.map((c) => new CategoryDto(c));
	}
}

export class AttributeDto {
	name: string;
	widgetType: string;
	defaultValue: string;
	availableOptions: string[];

	constructor(attribute: {
		name: string;
		widgetType: string;
		defaultValue: string;
		availableOptions: string[];
	}) {
		this.name = attribute.name;
		this.widgetType = attribute.widgetType;
		this.defaultValue = attribute.defaultValue;
		this.availableOptions = attribute.availableOptions;
	}
}
