import type { OrderApplicationService } from "../../application/services/order-application.service";
import { CreateOrderDto } from "../../application/dto/order.dto";
import type { Request } from "express";
export declare class OrderController {
  private readonly orderService;
  constructor(orderService: OrderApplicationService);
  create(
    dto: CreateOrderDto,
    req: Request,
  ): Promise<import("../../domain/entities/order.entity").OrderEntity>;
  findOne(id: string): Promise<import("../../domain/entities/order.entity").OrderEntity | null>;
  cancel(id: string): Promise<{
    message: string;
  }>;
}
