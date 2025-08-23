import mongoose from 'mongoose';

const PriceConfigurationSchema = new mongoose.Schema({
	priceType: {
		type: String,
		enum: ['base', 'additional'],
	},
	availableOptions: {
		type: Map,
		of: Number,
	},
});

const AttributesSchema = new mongoose.Schema({
	name: {
		type: String,
	},
	value: {
		type: mongoose.Schema.Types.Mixed,
	},
});
const ProductSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
			unique: true,
		},
		description: {
			type: String,
			required: true,
		},
		imageUrl: {
			type: String,
			required: true,
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
		tenantId: {
			type: String,
			required: true,
			index: true,
		},
		categoryId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'categories',
			required: true,
			index: true,
		},
		isPublished: {
			type: Boolean,
			default: false,
		},
	},
	{
		timestamps: true,
	}
);

export default mongoose.model('products', ProductSchema);
