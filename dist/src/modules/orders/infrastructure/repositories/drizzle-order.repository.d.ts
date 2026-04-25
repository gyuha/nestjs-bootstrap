import type { DrizzleService } from '../../../../infrastructure/database/drizzle.service';
import type { OrderRepository } from '../../domain/repositories/order.repository.interface';
import type { OrderEntity } from '../../domain/entities/order.entity';
export declare class DrizzleOrderRepository implements OrderRepository {
    private readonly db;
    constructor(db: DrizzleService);
    findById(id: string): Promise<OrderEntity | null>;
    findByUserId(userId: string): Promise<OrderEntity[]>;
    save(entity: OrderEntity): Promise<void>;
    updateStatus(id: string, status: string): Promise<void>;
}
