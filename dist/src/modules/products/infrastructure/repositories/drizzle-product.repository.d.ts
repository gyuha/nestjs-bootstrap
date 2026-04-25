import type { DrizzleService } from '../../../../infrastructure/database/drizzle.service';
import type { ProductEntity } from '../../domain/entities/product.entity';
import type { ProductRepository } from '../../domain/repositories/product.repository.interface';
export declare class DrizzleProductRepository implements ProductRepository {
    private readonly db;
    constructor(db: DrizzleService);
    findById(id: string): Promise<ProductEntity | null>;
    findAll(query: {
        categoryId?: string;
        isActive?: boolean;
        page?: number;
        limit?: number;
    }): Promise<{
        data: ProductEntity[];
        total: number;
    }>;
    save(entity: ProductEntity): Promise<void>;
    update(entity: ProductEntity): Promise<void>;
    delete(id: string): Promise<void>;
    updateStock(id: string, quantity: number): Promise<void>;
}
