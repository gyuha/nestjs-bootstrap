import type { ProductEntity } from '../../domain/entities/product.entity';
import type { ProductRepository } from '../../domain/repositories/product.repository.interface';
export declare class ProductApplicationService {
    private readonly productRepo;
    constructor(productRepo: ProductRepository);
    create(dto: {
        name: string;
        description?: string;
        price: number;
        quantity: number;
        lowStockThreshold?: number;
        location?: string;
        categoryId?: string;
    }): Promise<ProductEntity>;
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
    update(id: string, dto: Partial<ProductEntity>): Promise<ProductEntity>;
    delete(id: string): Promise<void>;
    adjustStock(id: string, quantity: number): Promise<ProductEntity>;
}
