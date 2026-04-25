"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersModule = void 0;
const common_1 = require("@nestjs/common");
const drizzle_module_1 = require("../../infrastructure/database/drizzle.module");
const order_controller_1 = require("./presentation/controllers/order.controller");
const order_application_service_1 = require("./application/services/order-application.service");
const stock_service_1 = require("../stock/infrastructure/services/stock-service");
const drizzle_order_repository_1 = require("./infrastructure/repositories/drizzle-order.repository");
const ORDER_REPOSITORY = 'ORDER_REPOSITORY';
let OrdersModule = class OrdersModule {
};
exports.OrdersModule = OrdersModule;
exports.OrdersModule = OrdersModule = __decorate([
    (0, common_1.Module)({
        imports: [drizzle_module_1.DrizzleModule],
        controllers: [order_controller_1.OrderController],
        providers: [
            order_application_service_1.OrderApplicationService,
            stock_service_1.StockService,
            { provide: ORDER_REPOSITORY, useClass: drizzle_order_repository_1.DrizzleOrderRepository },
        ],
        exports: [order_application_service_1.OrderApplicationService],
    })
], OrdersModule);
//# sourceMappingURL=orders.module.js.map