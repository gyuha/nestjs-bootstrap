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
exports.OrderController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const throttler_1 = require("@nestjs/throttler");
const order_dto_1 = require("../../application/dto/order.dto");
const public_decorator_1 = require("../../../auth/presentation/decorators/public.decorator");
const response_envelope_interceptor_1 = require("../../../../shared/presentation/interceptors/response-envelope.interceptor");
const common_2 = require("@nestjs/common");
let OrderController = class OrderController {
  constructor(orderService) {
    this.orderService = orderService;
  }
  async create(dto, req) {
    const userId = req.user?.id || "anonymous";
    return this.orderService.createOrder(dto.items, userId);
  }
  async findOne(id) {
    return this.orderService.findById(id);
  }
  async cancel(id) {
    await this.orderService.cancelOrder(id);
    return { message: "Order cancelled" };
  }
};
exports.OrderController = OrderController;
__decorate(
  [
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: "Create order" }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [order_dto_1.CreateOrderDto, Object]),
    __metadata("design:returntype", Promise),
  ],
  OrderController.prototype,
  "create",
  null,
);
__decorate(
  [
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(":id"),
    (0, swagger_1.ApiOperation)({ summary: "Get order" }),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise),
  ],
  OrderController.prototype,
  "findOne",
  null,
);
__decorate(
  [
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)(":id/cancel"),
    (0, swagger_1.ApiOperation)({ summary: "Cancel order" }),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise),
  ],
  OrderController.prototype,
  "cancel",
  null,
);
exports.OrderController = OrderController = __decorate(
  [
    (0, swagger_1.ApiTags)("Orders"),
    (0, common_1.Controller)("orders"),
    (0, common_1.UseGuards)(throttler_1.ThrottlerGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_2.UseInterceptors)(response_envelope_interceptor_1.ResponseEnvelopeInterceptor),
    __metadata("design:paramtypes", [Function]),
  ],
  OrderController,
);
//# sourceMappingURL=order.controller.js.map
