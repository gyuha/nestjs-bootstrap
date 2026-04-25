"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stockMovements = exports.stockMovementTypeEnum = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const products_schema_1 = require("./products.schema");
exports.stockMovementTypeEnum = (0, pg_core_1.pgEnum)("stock_movement_type", [
  "IN",
  "OUT",
  "ADJUSTMENT",
]);
exports.stockMovements = (0, pg_core_1.pgTable)("stock_movements", {
  id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
  productId: (0, pg_core_1.uuid)("product_id")
    .notNull()
    .references(() => products_schema_1.products.id),
  quantity: (0, pg_core_1.integer)("quantity").notNull(),
  type: (0, exports.stockMovementTypeEnum)("type").notNull(),
  reason: (0, pg_core_1.varchar)("reason", { length: 255 }),
  createdAt: (0, pg_core_1.timestamp)("created_at").notNull().defaultNow(),
});
//# sourceMappingURL=stock-movements.schema.js.map
