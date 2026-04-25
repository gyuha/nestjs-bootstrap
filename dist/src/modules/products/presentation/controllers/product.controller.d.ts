import type { ProductApplicationService } from "../../application/services/product-application.service";
import {
  CreateProductDto,
  UpdateProductDto,
  AdjustStockDto,
} from "../../application/dto/product.dto";
export declare class ProductController {
  private readonly productService;
  constructor(productService: ProductApplicationService);
  findAll(query: {
    categoryId?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{
    data: import("../../domain/entities/product.entity").ProductEntity[];
    total: number;
  }>;
  findOne(id: string): Promise<import("../../domain/entities/product.entity").ProductEntity>;
  create(
    dto: CreateProductDto,
  ): Promise<import("../../domain/entities/product.entity").ProductEntity>;
  update(
    id: string,
    dto: UpdateProductDto,
  ): Promise<import("../../domain/entities/product.entity").ProductEntity>;
  delete(id: string): Promise<{
    message: string;
  }>;
  adjustStock(
    id: string,
    dto: AdjustStockDto,
  ): Promise<import("../../domain/entities/product.entity").ProductEntity>;
}
