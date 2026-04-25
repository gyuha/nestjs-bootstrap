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
var __param =
  (this && this.__param) ||
  function (paramIndex, decorator) {
    return function (target, key) {
      decorator(target, key, paramIndex);
    };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderApplicationService = void 0;
const common_1 = require("@nestjs/common");
const order_status_value_object_1 = require("../../domain/value-objects/order-status.value-object");
const ORDER_REPOSITORY = "ORDER_REPOSITORY";
let OrderApplicationService = class OrderApplicationService {
  constructor(orderRepo, stockService) {
    this.orderRepo = orderRepo;
    this.stockService = stockService;
  }
  async createOrder(items, userId) {
    const orderItems = [];
    let totalAmount = 0;
    for (const item of items) {
      const updatedProduct = await this.stockService.validateAndDecrementStock(
        item.productId,
        item.quantity,
      );
      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: updatedProduct.price,
      });
      totalAmount += updatedProduct.price * item.quantity;
    }
    const order = {
      id: crypto.randomUUID(),
      userId,
      status: order_status_value_object_1.OrderStatus.PENDING,
      totalAmount,
      items: orderItems,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await this.orderRepo.save(order);
    return order;
  }
  async findById(id) {
    return this.orderRepo.findById(id);
  }
  async findByUserId(userId) {
    return this.orderRepo.findByUserId(userId);
  }
  async cancelOrder(orderId) {
    const order = await this.orderRepo.findById(orderId);
    if (!order) throw new Error("Order not found");
    if (order.status === order_status_value_object_1.OrderStatus.CANCELLED)
      throw new Error("Order already cancelled");
    for (const item of order.items) {
      await this.stockService.incrementStock(item.productId, item.quantity);
    }
    await this.orderRepo.updateStatus(orderId, order_status_value_object_1.OrderStatus.CANCELLED);
  }
  async updateOrderStatus(orderId, status) {
    await this.orderRepo.updateStatus(orderId, status);
  }
};
exports.OrderApplicationService = OrderApplicationService;
exports.OrderApplicationService = OrderApplicationService = __decorate(
  [
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(ORDER_REPOSITORY)),
    __metadata("design:paramtypes", [Object, Object]),
  ],
  OrderApplicationService,
);
//# sourceMappingURL=order-application.service.js.map
