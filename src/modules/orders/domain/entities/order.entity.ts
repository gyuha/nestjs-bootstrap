export interface OrderItemEntity {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface OrderEntity {
  id: string;
  userId: string;
  status: string;
  totalAmount: number;
  items: OrderItemEntity[];
  createdAt: Date;
  updatedAt: Date;
}