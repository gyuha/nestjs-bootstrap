import { Injectable, Inject } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { DrizzleService } from "../../../../infrastructure/database/drizzle.service";
import { products } from "../../../../infrastructure/database/schema/products.schema";
import { stockMovements } from "../../../../infrastructure/database/schema/stock-movements.schema";
import type { StockServiceInterface } from "../../domain/services/stock-service.interface";
import type { ProductEntity } from "../../../products/domain/entities/product.entity";

@Injectable()
export class StockService implements StockServiceInterface {
  constructor(private readonly db: DrizzleService) {}

  async validateAndDecrementStock(productId: string, quantity: number): Promise<ProductEntity> {
    const result = await this.db.db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);
    const product = result[0];

    if (!product) throw new Error("Product not found");
    if (!product.isActive) throw new Error("Product is not active");
    if (product.quantity < quantity) throw new Error("Insufficient stock");

    const newQuantity = product.quantity - quantity;
    await this.db.db
      .update(products)
      .set({ quantity: newQuantity, updatedAt: new Date() })
      .where(eq(products.id, productId));

    // Record stock movement
    await this.db.db.insert(stockMovements).values({
      productId,
      quantity,
      type: "OUT",
      reason: "ORDER",
    });

    return {
      id: product.id,
      name: product.name,
      description: product.description ?? null,
      price: parseFloat(product.price),
      quantity: newQuantity,
      lowStockThreshold: product.lowStockThreshold,
      location: product.location ?? null,
      categoryId: product.categoryId ?? null,
      isActive: product.isActive,
      createdAt: product.createdAt,
      updatedAt: new Date(),
    };
  }

  async incrementStock(productId: string, quantity: number): Promise<void> {
    const result = await this.db.db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);
    const product = result[0];

    if (!product) throw new Error("Product not found");

    const newQuantity = product.quantity + quantity;
    await this.db.db
      .update(products)
      .set({ quantity: newQuantity, updatedAt: new Date() })
      .where(eq(products.id, productId));

    // Record stock movement
    await this.db.db.insert(stockMovements).values({
      productId,
      quantity,
      type: "IN",
      reason: "ORDER_CANCELLED",
    });
  }
}
