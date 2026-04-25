"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orders = exports.orderStatusEnum = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
exports.orderStatusEnum = (0, pg_core_1.pgEnum)('order_status', ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED']);
exports.orders = (0, pg_core_1.pgTable)('orders', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)('user_id').notNull(),
    status: (0, exports.orderStatusEnum)('status').notNull().default('PENDING'),
    totalAmount: (0, pg_core_1.decimal)('total_amount', { precision: 10, scale: 2 }).notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').notNull().defaultNow(),
});
//# sourceMappingURL=orders.schema.js.map