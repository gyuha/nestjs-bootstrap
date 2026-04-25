import { Injectable } from "@nestjs/common";
import { eq, and, sql } from "drizzle-orm";
import { DrizzleService } from "../../../../infrastructure/database/drizzle.service";
import {
  products,
  type Product,
  type NewProduct,
} from "../../../../infrastructure/database/schema/products.schema";
import type { ProductEntity } from "../../domain/entities/product.entity";
import type { ProductRepository } from "../../domain/repositories/product.repository.interface";

function toProductEntity(result: Product): ProductEntity {
  return {
    id: result.id,
    name: result.name,
    description: result.description ?? null,
    price: parseFloat(result.price),
    quantity: result.quantity,
    lowStockThreshold: result.lowStockThreshold,
    location: result.location ?? null,
    categoryId: result.categoryId ?? null,
    isActive: result.isActive,
    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
  };
}

@Injectable()
export class DrizzleProductRepository implements ProductRepository {
  constructor(private readonly db: DrizzleService) {}

  async findById(id: string): Promise<ProductEntity | null> {
    const result = await this.db.db.select().from(products).where(eq(products.id, id)).limit(1);
    return result[0] ? toProductEntity(result[0]) : null;
  }

  async findAll(query: {
    categoryId?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ data: ProductEntity[]; total: number }> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;
    const conditions = [];
    if (query.categoryId) conditions.push(eq(products.categoryId, query.categoryId));
    if (query.isActive !== undefined) conditions.push(eq(products.isActive, query.isActive));
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const data = await this.db.db
      .select()
      .from(products)
      .where(whereClause)
      .limit(limit)
      .offset(offset);
    const countResult = await this.db.db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(whereClause);
    return { data: data.map(toProductEntity), total: countResult[0]?.count ?? 0 };
  }

  async save(entity: ProductEntity): Promise<void> {
    const newProduct: NewProduct = {
      name: entity.name,
      description: entity.description,
      price: entity.price.toString(),
      quantity: entity.quantity,
      lowStockThreshold: entity.lowStockThreshold,
      location: entity.location,
      categoryId: entity.categoryId,
      isActive: entity.isActive,
    };
    await this.db.db.insert(products).values(newProduct);
  }

  async update(entity: ProductEntity): Promise<void> {
    const { id, price, ...data } = entity;
    await this.db.db
      .update(products)
      .set({ ...data, price: price.toString() })
      .where(eq(products.id, id));
  }

  async delete(id: string): Promise<void> {
    await this.db.db.delete(products).where(eq(products.id, id));
  }

  async updateStock(id: string, quantity: number): Promise<void> {
    await this.db.db
      .update(products)
      .set({ quantity, updatedAt: new Date() })
      .where(eq(products.id, id));
  }
}
