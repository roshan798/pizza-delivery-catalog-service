import toppingModel from './model';
import { Topping } from './types';
export class ToppingService {
	private readonly model;
	constructor(model = toppingModel) {
		this.model = model;
	}
	async getAllToppings() {
		return await this.model.find();
	}
	async getToppingById(id: string) {
		return await this.model.findById(id);
	}
	async createTopping(toppingData: Partial<Topping>) {
		return await this.model.create(toppingData);
	}
	async updateTopping(id: string, toppingData: Partial<Topping>) {
		if (!id) return null;
		return await this.model.findByIdAndUpdate(id, toppingData, {
			new: true,
		});
	}

	async deleteTopping(id: string) {
		if (!id) return null;
		return await this.model.findByIdAndDelete(id);
	}
}
