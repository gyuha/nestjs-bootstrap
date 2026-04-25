import type { DrizzleService } from "../../../../infrastructure/database/drizzle.service";
import type { StockServiceInterface } from "../../domain/services/stock-service.interface";
import type { ProductEntity } from "../../../products/domain/entities/product.entity";
export declare class StockService implements StockServiceInterface {
  private readonly db;
  constructor(db: DrizzleService);
  validateAndDecrementStock(productId: string, quantity: number): Promise<ProductEntity>;
  incrementStock(productId: string, quantity: number): Promise<void>;
}
