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