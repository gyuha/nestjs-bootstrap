export declare class CreateProductDto {
    name: string;
    description?: string;
    price: number;
    quantity: number;
    lowStockThreshold?: number;
    location?: string;
    categoryId?: string;
}
export declare class UpdateProductDto {
    name?: string;
    description?: string;
    price?: number;
    isActive?: boolean;
}
export declare class AdjustStockDto {
    quantity: number;
}
