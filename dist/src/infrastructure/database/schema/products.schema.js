"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.products = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const categories_schema_1 = require("./categories.schema");
exports.products = (0, pg_core_1.pgTable)("products", {
  id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
  name: (0, pg_core_1.varchar)("name", { length: 255 }).notNull(),
  description: (0, pg_core_1.text)("description"),
  price: (0, pg_core_1.decimal)("price", { precision: 10, scale: 2 }).notNull(),
  quantity: (0, pg_core_1.integer)("quantity").notNull().default(0),
  lowStockThreshold: (0, pg_core_1.integer)("low_stock_threshold").notNull().default(10),
  location: (0, pg_core_1.varchar)("location", { length: 255 }),
  categoryId: (0, pg_core_1.uuid)("category_id").references(
    () => categories_schema_1.categories.id,
  ),
  isActive: (0, pg_core_1.boolean)("is_active").notNull().default(true),
  createdAt: (0, pg_core_1.timestamp)("created_at").notNull().defaultNow(),
  updatedAt: (0, pg_core_1.timestamp)("updated_at").notNull().defaultNow(),
});
//# sourceMappingURL=products.schema.js.map
