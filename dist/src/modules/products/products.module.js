"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductsModule = void 0;
const common_1 = require("@nestjs/common");
const drizzle_module_1 = require("../../infrastructure/database/drizzle.module");
const product_controller_1 = require("./presentation/controllers/product.controller");
const product_application_service_1 = require("./application/services/product-application.service");
const drizzle_product_repository_1 = require("./infrastructure/repositories/drizzle-product.repository");
const PRODUCT_REPOSITORY = 'PRODUCT_REPOSITORY';
let ProductsModule = class ProductsModule {
};
exports.ProductsModule = ProductsModule;
exports.ProductsModule = ProductsModule = __decorate([
    (0, common_1.Module)({
        imports: [drizzle_module_1.DrizzleModule],
        controllers: [product_controller_1.ProductController],
        providers: [
            product_application_service_1.ProductApplicationService,
            { provide: PRODUCT_REPOSITORY, useClass: drizzle_product_repository_1.DrizzleProductRepository },
        ],
        exports: [product_application_service_1.ProductApplicationService, PRODUCT_REPOSITORY],
    })
], ProductsModule);
//# sourceMappingURL=products.module.js.map