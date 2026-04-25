import { Module } from "@nestjs/common";
import { DrizzleModule } from "../../infrastructure/database/drizzle.module";
import { OrderController } from "./presentation/controllers/order.controller";
import { OrderApplicationService } from "./application/services/order-application.service";
import { StockService } from "../stock/infrastructure/services/stock-service";
import { DrizzleOrderRepository } from "./infrastructure/repositories/drizzle-order.repository";

const ORDER_REPOSITORY = "ORDER_REPOSITORY";

@Module({
  imports: [DrizzleModule],
  controllers: [OrderController],
  providers: [
    OrderApplicationService,
    StockService,
    { provide: ORDER_REPOSITORY, useClass: DrizzleOrderRepository },
  ],
  exports: [OrderApplicationService],
})
export class OrdersModule {}
