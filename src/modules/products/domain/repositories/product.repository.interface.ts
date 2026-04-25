import type { ProductEntity } from '../entities/product.entity';

export interface ProductRepository {
  findById(id: string): Promise<ProductEntity | null>;
  findAll(query: { categoryId?: string; isActive?: boolean; page?: number; limit?: number }): Promise<{ data: ProductEntity[]; total: number }>;
  save(entity: ProductEntity): Promise<void>;
  update(entity: ProductEntity): Promise<void>;
  delete(id: string): Promise<void>;
  updateStock(id: string, quantity: number): Promise<void>;
}
