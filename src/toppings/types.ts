export interface Topping {
	id: string;
	_id: string;
	name: string;
	price: number;
	image: string;
	tenantId: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface CreateToppingRequest {
	body: Partial<Topping>;
}
