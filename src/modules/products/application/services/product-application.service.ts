import { Injectable, Inject } from "@nestjs/common";
import type { ProductEntity } from "../../domain/entities/product.entity";
import type { ProductRepository } from "../../domain/repositories/product.repository.interface";

const PRODUCT_REPOSITORY = "PRODUCT_REPOSITORY";

@Injectable()
export class ProductApplicationService {
  constructor(@Inject(PRODUCT_REPOSITORY) private readonly productRepo: ProductRepository) {}

  async create(dto: {
    name: string;
    description?: string;
    price: number;
    quantity: number;
    lowStockThreshold?: number;
    location?: string;
    categoryId?: string;
  }): Promise<ProductEntity> {
    const product: ProductEntity = {
      id: crypto.randomUUID(),
      name: dto.name,
      description: dto.description ?? null,
      price: dto.price,
      quantity: dto.quantity,
      lowStockThreshold: dto.lowStockThreshold ?? 10,
      location: dto.location ?? null,
      categoryId: dto.categoryId ?? null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await this.productRepo.save(product);
    return product;
  }

  async findById(id: string): Promise<ProductEntity | null> {
    return this.productRepo.findById(id);
  }

  async findAll(query: { categoryId?: string; isActive?: boolean; page?: number; limit?: number }) {
    return this.productRepo.findAll(query);
  }

  async update(id: string, dto: Partial<ProductEntity>): Promise<ProductEntity> {
    const product = await this.productRepo.findById(id);
    if (!product) throw new Error("Product not found");
    const updated = { ...product, ...dto, updatedAt: new Date() };
    await this.productRepo.update(updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.productRepo.delete(id);
  }

  async adjustStock(id: string, quantity: number): Promise<ProductEntity> {
    const product = await this.productRepo.findById(id);
    if (!product) throw new Error("Product not found");
    const newQuantity = product.quantity + quantity;
    if (newQuantity < 0) throw new Error("Insufficient stock");
    await this.productRepo.updateStock(id, newQuantity);
    return { ...product, quantity: newQuantity };
  }
}
