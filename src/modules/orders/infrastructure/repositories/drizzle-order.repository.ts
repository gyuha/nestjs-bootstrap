import { Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import type { DrizzleService } from "../../../../infrastructure/database/drizzle.service";
import {
  orders,
  type Order,
  type NewOrder,
} from "../../../../infrastructure/database/schema/orders.schema";
import { orderItems } from "../../../../infrastructure/database/schema/order-items.schema";
import type { OrderRepository } from "../../domain/repositories/order.repository.interface";
import type { OrderEntity, OrderItemEntity } from "../../domain/entities/order.entity";

@Injectable()
export class DrizzleOrderRepository implements OrderRepository {
  constructor(private readonly db: DrizzleService) {}

  async findById(id: string): Promise<OrderEntity | null> {
    const orderResult = await this.db.db.select().from(orders).where(eq(orders.id, id)).limit(1);
    if (!orderResult[0]) return null;

    const order = orderResult[0];
    const itemsResult = await this.db.db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, id));

    const items: OrderItemEntity[] = itemsResult.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: parseFloat(item.unitPrice),
    }));

    return {
      id: order.id,
      userId: order.userId,
      status: order.status,
      totalAmount: parseFloat(order.totalAmount),
      items,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  async findByUserId(userId: string): Promise<OrderEntity[]> {
    const orderResults = await this.db.db.select().from(orders).where(eq(orders.userId, userId));

    const result: OrderEntity[] = [];
    for (const order of orderResults) {
      const itemsResult = await this.db.db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, order.id));
      const items: OrderItemEntity[] = itemsResult.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: parseFloat(item.unitPrice),
      }));
      result.push({
        id: order.id,
        userId: order.userId,
        status: order.status,
        totalAmount: parseFloat(order.totalAmount),
        items,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      });
    }
    return result;
  }

  async save(entity: OrderEntity): Promise<void> {
    const newOrder: NewOrder = {
      id: entity.id,
      userId: entity.userId,
      status: entity.status as "PENDING" | "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELLED",
      totalAmount: entity.totalAmount.toString(),
    };
    await this.db.db.insert(orders).values(newOrder);

    for (const item of entity.items) {
      await this.db.db.insert(orderItems).values({
        orderId: entity.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toString(),
      });
    }
  }

  async updateStatus(id: string, status: string): Promise<void> {
    await this.db.db
      .update(orders)
      .set({
        status: status as "PENDING" | "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELLED",
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id));
  }
}
