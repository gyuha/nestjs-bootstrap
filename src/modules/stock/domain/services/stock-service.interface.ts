import type { ProductEntity } from "../../../products/domain/entities/product.entity";

export interface StockServiceInterface {
  validateAndDecrementStock(productId: string, quantity: number): Promise<ProductEntity>;
  incrementStock(productId: string, quantity: number): Promise<void>;
}
