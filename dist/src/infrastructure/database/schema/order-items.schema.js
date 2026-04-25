"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderItems = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const orders_schema_1 = require("./orders.schema");
const products_schema_1 = require("./products.schema");
exports.orderItems = (0, pg_core_1.pgTable)("order_items", {
  id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
  orderId: (0, pg_core_1.uuid)("order_id")
    .notNull()
    .references(() => orders_schema_1.orders.id),
  productId: (0, pg_core_1.uuid)("product_id")
    .notNull()
    .references(() => products_schema_1.products.id),
  quantity: (0, pg_core_1.integer)("quantity").notNull(),
  unitPrice: (0, pg_core_1.decimal)("unit_price", { precision: 10, scale: 2 }).notNull(),
});
//# sourceMappingURL=order-items.schema.js.map
