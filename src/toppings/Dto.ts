import { Topping } from './types';

class ToppingDto {
	private readonly topping;
	constructor(toppingData: Topping) {
		this.topping = toppingData;
	}
	toJSON() {
		return {
			id: this.topping._id,
			name: this.topping.name,
			price: this.topping.price,
			image: this.topping.image,
			tenantId: this.topping.tenantId,
			createdAt: this.topping.createdAt,
			updatedAt: this.topping.updatedAt,
		};
	}
}

export default ToppingDto;
