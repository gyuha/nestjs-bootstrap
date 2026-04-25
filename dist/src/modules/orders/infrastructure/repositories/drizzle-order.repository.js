"use strict";
var __decorate =
  (this && this.__decorate) ||
  function (decorators, target, key, desc) {
    var c = arguments.length,
      r =
        c < 3
          ? target
          : desc === null
            ? (desc = Object.getOwnPropertyDescriptor(target, key))
            : desc,
      d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
      r = Reflect.decorate(decorators, target, key, desc);
    else
      for (var i = decorators.length - 1; i >= 0; i--)
        if ((d = decorators[i]))
          r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
  };
var __metadata =
  (this && this.__metadata) ||
  function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function")
      return Reflect.metadata(k, v);
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.DrizzleOrderRepository = void 0;
const common_1 = require("@nestjs/common");
const drizzle_orm_1 = require("drizzle-orm");
const orders_schema_1 = require("../../../../infrastructure/database/schema/orders.schema");
const order_items_schema_1 = require("../../../../infrastructure/database/schema/order-items.schema");
let DrizzleOrderRepository = class DrizzleOrderRepository {
  constructor(db) {
    this.db = db;
  }
  async findById(id) {
    const orderResult = await this.db.db
      .select()
      .from(orders_schema_1.orders)
      .where((0, drizzle_orm_1.eq)(orders_schema_1.orders.id, id))
      .limit(1);
    if (!orderResult[0]) return null;
    const order = orderResult[0];
    const itemsResult = await this.db.db
      .select()
      .from(order_items_schema_1.orderItems)
      .where((0, drizzle_orm_1.eq)(order_items_schema_1.orderItems.orderId, id));
    const items = itemsResult.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: parseFloat(item.unitPrice),
    }));
    return {
      id: order.id,
      userId: order.userId,
      status: order.status,
      totalAmount: parseFloat(order.totalAmount),
      items,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }
  async findByUserId(userId) {
    const orderResults = await this.db.db
      .select()
      .from(orders_schema_1.orders)
      .where((0, drizzle_orm_1.eq)(orders_schema_1.orders.userId, userId));
    const result = [];
    for (const order of orderResults) {
      const itemsResult = await this.db.db
        .select()
        .from(order_items_schema_1.orderItems)
        .where((0, drizzle_orm_1.eq)(order_items_schema_1.orderItems.orderId, order.id));
      const items = itemsResult.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: parseFloat(item.unitPrice),
      }));
      result.push({
        id: order.id,
        userId: order.userId,
        status: order.status,
        totalAmount: parseFloat(order.totalAmount),
        items,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      });
    }
    return result;
  }
  async save(entity) {
    const newOrder = {
      id: entity.id,
      userId: entity.userId,
      status: entity.status,
      totalAmount: entity.totalAmount.toString(),
    };
    await this.db.db.insert(orders_schema_1.orders).values(newOrder);
    for (const item of entity.items) {
      await this.db.db.insert(order_items_schema_1.orderItems).values({
        orderId: entity.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toString(),
      });
    }
  }
  async updateStatus(id, status) {
    await this.db.db
      .update(orders_schema_1.orders)
      .set({
        status: status,
        updatedAt: new Date(),
      })
      .where((0, drizzle_orm_1.eq)(orders_schema_1.orders.id, id));
  }
};
exports.DrizzleOrderRepository = DrizzleOrderRepository;
exports.DrizzleOrderRepository = DrizzleOrderRepository = __decorate(
  [(0, common_1.Injectable)(), __metadata("design:paramtypes", [Function])],
  DrizzleOrderRepository,
);
//# sourceMappingURL=drizzle-order.repository.js.map
