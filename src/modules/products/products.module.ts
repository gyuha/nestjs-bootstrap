import { Module } from "@nestjs/common";
import { DrizzleModule } from "../../infrastructure/database/drizzle.module";
import { ProductController } from "./presentation/controllers/product.controller";
import { ProductApplicationService } from "./application/services/product-application.service";
import { DrizzleProductRepository } from "./infrastructure/repositories/drizzle-product.repository";

const PRODUCT_REPOSITORY = "PRODUCT_REPOSITORY";

@Module({
  imports: [DrizzleModule],
  controllers: [ProductController],
  providers: [
    ProductApplicationService,
    { provide: PRODUCT_REPOSITORY, useClass: DrizzleProductRepository },
  ],
  exports: [ProductApplicationService, PRODUCT_REPOSITORY],
})
export class ProductsModule {}
