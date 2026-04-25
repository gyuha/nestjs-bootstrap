import type { OrderEntity } from "../entities/order.entity";
export interface OrderRepository {
  findById(id: string): Promise<OrderEntity | null>;
  findByUserId(userId: string): Promise<OrderEntity[]>;
  save(entity: OrderEntity): Promise<void>;
  updateStatus(id: string, status: string): Promise<void>;
}
