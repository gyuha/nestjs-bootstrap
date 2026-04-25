export interface ProductEntity {
  id: string;
  name: string;
  description: string | null;
  price: number;
  quantity: number;
  lowStockThreshold: number;
  location: string | null;
  categoryId: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
