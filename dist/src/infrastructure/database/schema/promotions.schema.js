"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.promotions = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
exports.promotions = (0, pg_core_1.pgTable)("promotions", {
  id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
  name: (0, pg_core_1.varchar)("name", { length: 255 }).notNull(),
  discountPercent: (0, pg_core_1.decimal)("discount_percent", { precision: 5, scale: 2 }).notNull(),
  startDate: (0, pg_core_1.timestamp)("start_date").notNull(),
  endDate: (0, pg_core_1.timestamp)("end_date").notNull(),
  isActive: (0, pg_core_1.boolean)("is_active").notNull().default(true),
  createdAt: (0, pg_core_1.timestamp)("created_at").notNull().defaultNow(),
});
//# sourceMappingURL=promotions.schema.js.map
