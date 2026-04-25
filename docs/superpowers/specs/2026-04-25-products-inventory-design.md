# Products/Inventory Module Design Spec

> **For agentic workers:** This spec serves as input for the implementation plan.

**Goal:** Implement Products/Inventory module with full CRUD, stock management, categories, promotions, and bidirectional order integration.

**Architecture:** PostgreSQL + Redis cache, RESTful API, DDD 4-layer architecture.

---

## Database Schema

### Products Table

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| name | varchar | Product name |
| description | text | Product description |
| price | decimal(10,2) | Base price |
| quantity | integer | Current stock quantity |
| lowStockThreshold | integer | Alert threshold |
| location | varchar | Storage location |
| categoryId | uuid | FK to categories |
| isActive | boolean | Product availability |
| createdAt | timestamp | Creation time |
| updatedAt | timestamp | Last update |

### Categories Table

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| name | varchar | Category name |
| description | text | Category description |
| parentId | uuid | Self-reference (parent category) |
| createdAt | timestamp | Creation time |

### Promotions Table

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| name | varchar | Promotion name |
| discountPercent | decimal(5,2) | Discount percentage |
| startDate | timestamp | Promotion start |
| endDate | timestamp | Promotion end |
| isActive | boolean | Promotion status |
| createdAt | timestamp | Creation time |

### Orders Table

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| userId | uuid | FK to users |
| status | enum | PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED |
| totalAmount | decimal(10,2) | Order total |
| createdAt | timestamp | Creation time |
| updatedAt | timestamp | Last update |

### OrderItems Table

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| orderId | uuid | FK to orders |
| productId | uuid | FK to products |
| quantity | integer | Ordered quantity |
| unitPrice | decimal(10,2) | Price at order time |

### StockMovements Table (재고 이력)

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| productId | uuid | FK to products |
| quantity | integer | Change amount (+/-) |
| type | enum | IN, OUT, ADJUSTMENT |
| reason | varchar | Movement reason |
| createdAt | timestamp | Creation time |

---

## Module Structure

```
src/modules/products/
├── domain/
│   ├── entities/
│   ├── value-objects/
│   └── repositories/
├── application/
│   ├── services/
│   └── dto/
├── infrastructure/
│   └── repositories/
└── presentation/
    └── controllers/

src/modules/categories/
src/modules/promotions/
src/modules/orders/
src/modules/stock/
```

---

## Redis Caching Strategy

**Cache Keys:**
- `products:list` - All products list (TTL: 5 min)
- `products:${id}` - Single product (TTL: 10 min)
- `categories:list` - All categories (TTL: 30 min)
- `categories:${id}` - Single category (TTL: 30 min)

**Invalidation:**
- Product create/update/delete → Delete `products:*`
- Category update → Delete `categories:*`

---

## API Endpoints

### Products

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/v1/products | List products (paginated) |
| POST | /api/v1/products | Create product |
| GET | /api/v1/products/:id | Get product |
| PUT | /api/v1/products/:id | Update product |
| DELETE | /api/v1/products/:id | Delete product |
| POST | /api/v1/products/:id/stock | Adjust stock |

### Categories

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/v1/categories | List categories |
| POST | /api/v1/categories | Create category |
| GET | /api/v1/categories/:id | Get category |
| PUT | /api/v1/categories/:id | Update category |
| DELETE | /api/v1/categories/:id | Delete category |

### Promotions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/v1/promotions | List promotions |
| POST | /api/v1/promotions | Create promotion |
| GET | /api/v1/promotions/:id | Get promotion |
| PUT | /api/v1/promotions/:id | Update promotion |
| DELETE | /api/v1/promotions/:id | Delete promotion |

### Orders

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/v1/orders | List orders |
| POST | /api/v1/orders | Create order |
| GET | /api/v1/orders/:id | Get order |
| PUT | /api/v1/orders/:id | Update order status |
| POST | /api/v1/orders/:id/cancel | Cancel order |

---

## Stock Management Logic

**재고 차감 (Order Creation):**
1. Validate product exists and is active
2. Check sufficient stock (quantity >= requested)
3. If insufficient → reject order with STOCK_INSUFFICIENT error
4. If sufficient → decrement stock, create OrderItems, create StockMovement record

**재고 환불 (Order Cancellation):**
1. Increment stock back
2. Create StockMovement record with type OUT and reason "CANCELLED_ORDER"

**Low Stock Alert:**
- When quantity <= lowStockThreshold → trigger alert (log + event)

---

## Implementation Notes

- Use string token DI pattern (not interface types)
- Follow existing DDD 4-layer architecture
- PostgreSQL for persistence, Redis for caching
- Use Drizzle ORM with existing patterns
- Use Transaction for order creation (stock + order in single tx)
