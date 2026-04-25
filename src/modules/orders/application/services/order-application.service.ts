import { Injectable, Inject } from "@nestjs/common";
import type { OrderRepository } from "../../domain/repositories/order.repository.interface";
import type { StockServiceInterface } from "../../../stock/domain/services/stock-service.interface";
import type { OrderEntity, OrderItemEntity } from "../../domain/entities/order.entity";
import { OrderStatus } from "../../domain/value-objects/order-status.value-object";

const ORDER_REPOSITORY = "ORDER_REPOSITORY";

@Injectable()
export class OrderApplicationService {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orderRepo: OrderRepository,
    private readonly stockService: StockServiceInterface,
  ) {}

  async createOrder(
    items: { productId: string; quantity: number }[],
    userId: string,
  ): Promise<OrderEntity> {
    // Validate and decrement stock for each item
    const orderItems: OrderItemEntity[] = [];
    let totalAmount = 0;

    for (const item of items) {
      const updatedProduct = await this.stockService.validateAndDecrementStock(
        item.productId,
        item.quantity,
      );
      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: updatedProduct.price,
      });
      totalAmount += updatedProduct.price * item.quantity;
    }

    // Create order
    const order: OrderEntity = {
      id: crypto.randomUUID(),
      userId,
      status: OrderStatus.PENDING,
      totalAmount,
      items: orderItems,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.orderRepo.save(order);
    return order;
  }

  async findById(id: string): Promise<OrderEntity | null> {
    return this.orderRepo.findById(id);
  }

  async findByUserId(userId: string): Promise<OrderEntity[]> {
    return this.orderRepo.findByUserId(userId);
  }

  async cancelOrder(orderId: string): Promise<void> {
    const order = await this.orderRepo.findById(orderId);
    if (!order) throw new Error("Order not found");
    if (order.status === OrderStatus.CANCELLED) throw new Error("Order already cancelled");

    // Return stock
    for (const item of order.items) {
      await this.stockService.incrementStock(item.productId, item.quantity);
    }

    await this.orderRepo.updateStatus(orderId, OrderStatus.CANCELLED);
  }

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
    await this.orderRepo.updateStatus(orderId, status);
  }
}
