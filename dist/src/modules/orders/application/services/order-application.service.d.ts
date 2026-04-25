import type { OrderRepository } from '../../domain/repositories/order.repository.interface';
import type { StockServiceInterface } from '../../../stock/domain/services/stock-service.interface';
import type { OrderEntity } from '../../domain/entities/order.entity';
import { OrderStatus } from '../../domain/value-objects/order-status.value-object';
export declare class OrderApplicationService {
    private readonly orderRepo;
    private readonly stockService;
    constructor(orderRepo: OrderRepository, stockService: StockServiceInterface);
    createOrder(items: {
        productId: string;
        quantity: number;
    }[], userId: string): Promise<OrderEntity>;
    findById(id: string): Promise<OrderEntity | null>;
    findByUserId(userId: string): Promise<OrderEntity[]>;
    cancelOrder(orderId: string): Promise<void>;
    updateOrderStatus(orderId: string, status: OrderStatus): Promise<void>;
}
