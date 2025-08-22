import mongoose from 'mongoose';
import { Attribute, Category, PriceConfiguration } from './types';

const PriceConfigurationSchema = new mongoose.Schema<PriceConfiguration>({
	priceType: {
		type: String,
		enum: ['base', 'additional'],
		required: true,
	},
	availableOptions: {
		type: [String],
		required: true,
	},
});

const AttributesSchema = new mongoose.Schema<Attribute>({
	name: {
		type: String,
		required: true,
	},
	widgetType: {
		type: String,
		enum: ['radio', 'switch'],
		required: true,
	},
	defaultValue: {
		type: mongoose.Schema.Types.Mixed,
		required: true,
	},
	availableOptions: {
		type: [String],
		required: true,
	},
});
const CategorySchema = new mongoose.Schema<Category>(
	{
		name: {
			type: String,
			required: true,
			unique: true,
		},
		priceConfiguration: {
			type: Map,
			of: PriceConfigurationSchema,
			required: true,
		},
		attributes: {
			type: [AttributesSchema],
			required: true,
		},
	},
	{
		timestamps: true,
	}
);

export default mongoose.model('categories', CategorySchema);
