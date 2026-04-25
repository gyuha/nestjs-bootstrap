# Products/Inventory Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Products/Inventory module with full CRUD, stock management, categories, promotions, and bidirectional order integration.

**Architecture:** PostgreSQL + Redis cache, RESTful API, DDD 4-layer architecture.

**Tech Stack:** NestJS 11, Drizzle ORM, PostgreSQL, Redis (ioredis)

---

## File Structure

```
src/infrastructure/database/schema/
  products.schema.ts         # NEW
  categories.schema.ts       # NEW
  promotions.schema.ts       # NEW
  orders.schema.ts           # NEW
  order-items.schema.ts     # NEW
  stock-movements.schema.ts  # NEW

src/modules/products/
  domain/entities/           # Product, Category entities
  domain/repositories/       # Repository interfaces
  application/services/      # Application services
  application/dto/           # DTOs
  infrastructure/repositories/ # Drizzle implementations
  presentation/controllers/  # Controllers
  products.module.ts         # Module wiring

src/modules/categories/    # Similar structure
src/modules/promotions/      # Similar structure
src/modules/orders/          # Similar structure
src/modules/stock/           # Stock management

src/shared/
  infrastructure/redis/      # Redis service (exists)
  utils/                      # Shared utilities
```

---

## Task 1: Create Database Schemas

**Files:**
- Create: `src/infrastructure/database/schema/products.schema.ts`
- Create: `src/infrastructure/database/schema/categories.schema.ts`
- Create: `src/infrastructure/database/schema/promotions.schema.ts`
- Create: `src/infrastructure/database/schema/orders.schema.ts`
- Create: `src/infrastructure/database/schema/order-items.schema.ts`
- Create: `src/infrastructure/database/schema/stock-movements.schema.ts`

- [ ] **Step 1: Create products.schema.ts**

```typescript
// src/infrastructure/database/schema/products.schema.ts
import { pgTable, uuid, varchar, text, decimal, integer, boolean, timestamp } from 'drizzle-orm/pg-core';
import { categories } from './categories.schema';

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  quantity: integer('quantity').notNull().default(0),
  lowStockThreshold: integer('low_stock_threshold').notNull().default(10),
  location: varchar('location', { length: 255 }),
  categoryId: uuid('category_id').references(() => categories.id),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
```

- [ ] **Step 2: Create categories.schema.ts**

```typescript
// src/infrastructure/database/schema/categories.schema.ts
import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';

export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  parentId: uuid('parent_id'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
```

- [ ] **Step 3: Create promotions.schema.ts**

```typescript
// src/infrastructure/database/schema/promotions.schema.ts
import { pgTable, uuid, varchar, decimal, timestamp, boolean } from 'drizzle-orm/pg-core';

export const promotions = pgTable('promotions', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  discountPercent: decimal('discount_percent', { precision: 5, scale: 2 }).notNull(),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type Promotion = typeof promotions.$inferSelect;
export type NewPromotion = typeof promotions.$inferInsert;
```

- [ ] **Step 4: Create orders.schema.ts**

```typescript
// src/infrastructure/database/schema/orders.schema.ts
import { pgTable, uuid, varchar, decimal, timestamp, pgEnum } from 'drizzle-orm/pg-core';

export const orderStatusEnum = pgEnum('order_status', ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED']);

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  status: orderStatusEnum('status').notNull().default('PENDING'),
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
```

- [ ] **Step 5: Create order-items.schema.ts**

```typescript
// src/infrastructure/database/schema/order-items.schema.ts
import { pgTable, uuid, decimal, integer } from 'drizzle-orm/pg-core';
import { orders } from './orders.schema';
import { products } from './products.schema';

export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').notNull().references(() => orders.id),
  productId: uuid('product_id').notNull().references(() => products.id),
  quantity: integer('quantity').notNull(),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
});

export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;
```

- [ ] **Step 6: Create stock-movements.schema.ts**

```typescript
// src/infrastructure/database/schema/stock-movements.schema.ts
import { pgTable, uuid, varchar, integer, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { products } from './products.schema';

export const stockMovementTypeEnum = pgEnum('stock_movement_type', ['IN', 'OUT', 'ADJUSTMENT']);

export const stockMovements = pgTable('stock_movements', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').notNull().references(() => products.id),
  quantity: integer('quantity').notNull(),
  type: stockMovementTypeEnum('type').notNull(),
  reason: varchar('reason', { length: 255 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type StockMovement = typeof stockMovements.$inferSelect;
export type NewStockMovement = typeof stockMovements.$inferInsert;
```

- [ ] **Step 7: Commit**

```bash
git add src/infrastructure/database/schema/*.schema.ts
git commit -m "feat(products): add database schemas for products, categories, promotions, orders

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 2: Create Products Module

**Files:**
- Create: `src/modules/products/domain/entities/product.entity.ts`
- Create: `src/modules/products/domain/entities/category.entity.ts`
- Create: `src/modules/products/domain/value-objects/order-status.value-object.ts`
- Create: `src/modules/products/domain/value-objects/stock-movement-type.value-object.ts`
- Create: `src/modules/products/domain/repositories/product.repository.interface.ts`
- Create: `src/modules/products/domain/repositories/category.repository.interface.ts`
- Create: `src/modules/products/application/services/product-application.service.ts`
- Create: `src/modules/products/application/services/category-application.service.ts`
- Create: `src/modules/products/application/dto/product.dto.ts`
- Create: `src/modules/products/application/dto/category.dto.ts`
- Create: `src/modules/products/infrastructure/repositories/drizzle-product.repository.ts`
- Create: `src/modules/products/infrastructure/repositories/drizzle-category.repository.ts`
- Create: `src/modules/products/presentation/controllers/product.controller.ts`
- Create: `src/modules/products/presentation/controllers/category.controller.ts`
- Create: `src/modules/products/products.module.ts`

- [ ] **Step 1: Create entities and value objects**

```typescript
// src/modules/products/domain/entities/product.entity.ts
export interface ProductEntity {
  id: string;
  name: string;
  description: string | null;
  price: number;
  quantity: number;
  lowStockThreshold: number;
  location: string | null;
  categoryId: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// src/modules/products/domain/value-objects/order-status.value-object.ts
export const OrderStatus = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
} as const;
export type OrderStatus = typeof OrderStatus[keyof typeof OrderStatus];
```

- [ ] **Step 2: Create repository interfaces**

```typescript
// src/modules/products/domain/repositories/product.repository.interface.ts
import type { ProductEntity } from '../entities/product.entity';

export interface ProductRepository {
  findById(id: string): Promise<ProductEntity | null>;
  findAll(query: { categoryId?: string; isActive?: boolean; page?: number; limit?: number }): Promise<{ data: ProductEntity[]; total: number }>;
  save(entity: ProductEntity): Promise<void>;
  update(entity: ProductEntity): Promise<void>;
  delete(id: string): Promise<void>;
  updateStock(id: string, quantity: number): Promise<void>;
}
```

- [ ] **Step 3: Create Drizzle repository implementations**

```typescript
// src/modules/products/infrastructure/repositories/drizzle-product.repository.ts
import { Injectable } from '@nestjs/common';
import { eq, and, sql } from 'drizzle-orm';
import type { DrizzleService } from '../../../../infrastructure/database/drizzle.service';
import { products, type Product, type NewProduct } from '../../../../infrastructure/database/schema/products.schema';
import type { ProductEntity } from '../../domain/entities/product.entity';
import type { ProductRepository } from '../../domain/repositories/product.repository.interface';

function toProductEntity(result: Product): ProductEntity {
  return {
    id: result.id,
    name: result.name,
    description: result.description ?? null,
    price: parseFloat(result.price),
    quantity: result.quantity,
    lowStockThreshold: result.lowStockThreshold,
    location: result.location ?? null,
    categoryId: result.categoryId ?? null,
    isActive: result.isActive,
    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
  };
}

@Injectable()
export class DrizzleProductRepository implements ProductRepository {
  constructor(private readonly db: DrizzleService) {}

  async findById(id: string): Promise<ProductEntity | null> {
    const result = await this.db.db.select().from(products).where(eq(products.id, id)).limit(1);
    return result[0] ? toProductEntity(result[0]) : null;
  }

  async findAll(query: { categoryId?: string; isActive?: boolean; page?: number; limit?: number }): Promise<{ data: ProductEntity[]; total: number }> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;
    const conditions = [];
    if (query.categoryId) conditions.push(eq(products.categoryId, query.categoryId));
    if (query.isActive !== undefined) conditions.push(eq(products.isActive, query.isActive));
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const data = await this.db.db.select().from(products).where(whereClause).limit(limit).offset(offset);
    const countResult = await this.db.db.select({ count: sql<number>`count(*)` }).from(products).where(whereClause);
    return { data: data.map(toProductEntity), total: countResult[0]?.count ?? 0 };
  }

  async save(entity: ProductEntity): Promise<void> {
    const newProduct: NewProduct = {
      name: entity.name,
      description: entity.description,
      price: entity.price.toString(),
      quantity: entity.quantity,
      lowStockThreshold: entity.lowStockThreshold,
      location: entity.location,
      categoryId: entity.categoryId,
      isActive: entity.isActive,
    };
    await this.db.db.insert(products).values(newProduct);
  }

  async update(entity: ProductEntity): Promise<void> {
    const { id, ...data } = entity;
    await this.db.db.update(products).set(data).where(eq(products.id, id));
  }

  async delete(id: string): Promise<void> {
    await this.db.db.delete(products).where(eq(products.id, id));
  }

  async updateStock(id: string, quantity: number): Promise<void> {
    await this.db.db.update(products).set({ quantity, updatedAt: new Date() }).where(eq(products.id, id));
  }
}
```

- [ ] **Step 4: Create application services**

```typescript
// src/modules/products/application/services/product-application.service.ts
import { Injectable, Inject } from '@nestjs/common';
import type { ProductEntity } from '../../domain/entities/product.entity';
import type { ProductRepository } from '../../domain/repositories/product.repository.interface';
import { ProductException } from './exceptions/product.exception';

const PRODUCT_REPOSITORY = 'PRODUCT_REPOSITORY';

@Injectable()
export class ProductApplicationService {
  constructor(@Inject(PRODUCT_REPOSITORY) private readonly productRepo: ProductRepository) {}

  async create(dto: { name: string; description?: string; price: number; quantity: number; lowStockThreshold?: number; location?: string; categoryId?: string }): Promise<ProductEntity> {
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

  async findById(id: string): Promise<ProductEntity> {
    const product = await this.productRepo.findById(id);
    if (!product) throw ProductException.notFound();
    return product;
  }

  async findAll(query: { categoryId?: string; isActive?: boolean; page?: number; limit?: number }) {
    return this.productRepo.findAll(query);
  }

  async update(id: string, dto: Partial<ProductEntity>): Promise<ProductEntity> {
    const product = await this.productRepo.findById(id);
    if (!product) throw ProductException.notFound();
    const updated = { ...product, ...dto, updatedAt: new Date() };
    await this.productRepo.update(updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    const product = await this.productRepo.findById(id);
    if (!product) throw ProductException.notFound();
    await this.productRepo.delete(id);
  }

  async adjustStock(id: string, quantity: number): Promise<ProductEntity> {
    const product = await this.productRepo.findById(id);
    if (!product) throw ProductException.notFound();
    const newQuantity = product.quantity + quantity;
    if (newQuantity < 0) throw ProductException.insufficientStock();
    await this.productRepo.updateStock(id, newQuantity);
    return { ...product, quantity: newQuantity };
  }
}
```

- [ ] **Step 5: Create DTOs and Controllers**

```typescript
// src/modules/products/application/dto/product.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsBoolean, IsOptional, IsInt, Min } from 'class-validator';

export class CreateProductDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsNumber()
  price: number;

  @ApiProperty()
  @IsInt()
  @Min(0)
  quantity: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  lowStockThreshold?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;
}
```

- [ ] **Step 6: Create module wiring and controller**

```typescript
// src/modules/products/products.module.ts
import { Module } from '@nestjs/common';
import { DrizzleModule } from '../../../infrastructure/database/drizzle.module';
import { ProductController } from './presentation/controllers/product.controller';
import { ProductApplicationService } from './application/services/product-application.service';
import { DrizzleProductRepository } from './infrastructure/repositories/drizzle-product.repository';
import type { ProductRepository } from './domain/repositories/product.repository.interface';

const PRODUCT_REPOSITORY = 'PRODUCT_REPOSITORY';

@Module({
  imports: [DrizzleModule],
  controllers: [ProductController],
  providers: [
    ProductApplicationService,
    { provide: PRODUCT_REPOSITORY, useClass: DrizzleProductRepository },
  ],
  exports: [ProductApplicationService, PRODUCT_REPOSITORY],
})
export class ProductsModule {}
```

- [ ] **Step 7: Commit**

```bash
git add src/modules/products/
git commit -m "feat(products): add products module with CRUD operations

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 3: Create Orders Module with Stock Integration

**Files:**
- Create: `src/modules/orders/domain/entities/order.entity.ts`
- Create: `src/modules/orders/domain/repositories/order.repository.interface.ts`
- Create: `src/modules/orders/application/services/order-application.service.ts`
- Create: `src/modules/orders/application/dto/order.dto.ts`
- Create: `src/modules/orders/infrastructure/repositories/drizzle-order.repository.ts`
- Create: `src/modules/orders/presentation/controllers/order.controller.ts`
- Create: `src/modules/orders/orders.module.ts`

- [ ] **Step 1: Create stock service for inventory management**

```typescript
// src/modules/stock/domain/services/stock-service.interface.ts
import type { ProductEntity } from '../../products/domain/entities/product.entity';

export interface StockServiceInterface {
  validateAndDecrementStock(productId: string, quantity: number): Promise<ProductEntity>;
  incrementStock(productId: string, quantity: number): Promise<void>;
  checkLowStock(product: ProductEntity): boolean;
}
```

- [ ] **Step 2: Create order service with stock management**

```typescript
// src/modules/orders/application/services/order-application.service.ts
import { Injectable, Inject } from '@nestjs/common';
import type { OrderRepository } from '../../domain/repositories/order.repository.interface';
import type { ProductRepository } from '../../../products/domain/repositories/product.repository.interface';
import type { StockService } from '../../../stock/domain/services/stock-service.interface';
import type { OrderEntity } from '../../domain/entities/order.entity';
import { OrderStatus } from '../../domain/value-objects/order-status.value-object';

const ORDER_REPOSITORY = 'ORDER_REPOSITORY';

@Injectable()
export class OrderApplicationService {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orderRepo: OrderRepository,
    @Inject('PRODUCT_REPOSITORY') private readonly productRepo: ProductRepository,
    private readonly stockService: StockService,
  ) {}

  async createOrder(items: { productId: string; quantity: number }[], userId: string): Promise<OrderEntity> {
    // Validate and decrement stock for each item
    const updatedProducts = [];
    for (const item of items) {
      const updated = await this.stockService.validateAndDecrementStock(item.productId, item.quantity);
      updatedProducts.push(updated);
    }

    // Calculate total
    const totalAmount = updatedProducts.reduce((sum, p) => sum + p.price * items.find(i => i.productId === p.id)!.quantity, 0);

    // Create order
    const order: OrderEntity = {
      id: crypto.randomUUID(),
      userId,
      status: OrderStatus.PENDING,
      totalAmount,
      items: items.map(i => ({ productId: i.productId, quantity: i.quantity, unitPrice: updatedProducts.find(p => p.id === i.productId)!.price })),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.orderRepo.save(order);
    return order;
  }

  async cancelOrder(orderId: string): Promise<void> {
    const order = await this.orderRepo.findById(orderId);
    if (!order) throw OrderException.notFound();
    if (order.status === OrderStatus.CANCELLED) throw OrderException.alreadyCancelled();

    // Return stock
    for (const item of order.items) {
      await this.stockService.incrementStock(item.productId, item.quantity);
    }

    await this.orderRepo.updateStatus(orderId, OrderStatus.CANCELLED);
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/modules/orders/
git commit -m "feat(orders): add orders module with stock integration

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 4: Generate Drizzle Migration

**Files:**
- Create: `drizzle/migrations/0002_add_products_modules.sql`

- [ ] **Step 1: Generate migration**

Run: `pnpm drizzle-kit generate`

- [ ] **Step 2: Commit**

```bash
git add drizzle/migrations/
git commit -m "chore(db): add products, orders, categories migration

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 5: Final Build and Test

**Files:**
- None (verification only)

- [ ] **Step 1: Run build**

Run: `pnpm build`
Expected: Exit code 0

- [ ] **Step 2: Run lint**

Run: `pnpm biome lint --write ./src`
Expected: Auto-fixes applied

- [ ] **Step 3: Run tests**

Run: `pnpm test`
Expected: All tests pass

- [ ] **Step 4: Commit lint fixes**

```bash
git add -A
git commit -m "style: apply biome lint auto-fixes

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Summary

| Task | Description |
|------|-------------|
| 1 | Create database schemas (products, categories, promotions, orders, order-items, stock-movements) |
| 2 | Create Products module with CRUD and Redis caching |
| 3 | Create Orders module with stock integration |
| 4 | Generate Drizzle migration |
| 5 | Final build and test |
