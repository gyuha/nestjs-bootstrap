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
exports.ProductController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const throttler_1 = require("@nestjs/throttler");
const product_dto_1 = require("../../application/dto/product.dto");
const public_decorator_1 = require("../../../../modules/auth/presentation/decorators/public.decorator");
const response_envelope_interceptor_1 = require("../../../../shared/presentation/interceptors/response-envelope.interceptor");
const common_2 = require("@nestjs/common");
let ProductController = class ProductController {
  constructor(productService) {
    this.productService = productService;
  }
  async findAll(query) {
    return this.productService.findAll(query);
  }
  async findOne(id) {
    const product = await this.productService.findById(id);
    if (!product) throw new Error("Product not found");
    return product;
  }
  async create(dto) {
    return this.productService.create(dto);
  }
  async update(id, dto) {
    return this.productService.update(id, dto);
  }
  async delete(id) {
    await this.productService.delete(id);
    return { message: "Product deleted" };
  }
  async adjustStock(id, dto) {
    return this.productService.adjustStock(id, dto.quantity);
  }
};
exports.ProductController = ProductController;
__decorate(
  [
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: "List products" }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise),
  ],
  ProductController.prototype,
  "findAll",
  null,
);
__decorate(
  [
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(":id"),
    (0, swagger_1.ApiOperation)({ summary: "Get product" }),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise),
  ],
  ProductController.prototype,
  "findOne",
  null,
);
__decorate(
  [
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: "Create product" }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [product_dto_1.CreateProductDto]),
    __metadata("design:returntype", Promise),
  ],
  ProductController.prototype,
  "create",
  null,
);
__decorate(
  [
    (0, public_decorator_1.Public)(),
    (0, common_1.Put)(":id"),
    (0, swagger_1.ApiOperation)({ summary: "Update product" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, product_dto_1.UpdateProductDto]),
    __metadata("design:returntype", Promise),
  ],
  ProductController.prototype,
  "update",
  null,
);
__decorate(
  [
    (0, public_decorator_1.Public)(),
    (0, common_1.Delete)(":id"),
    (0, swagger_1.ApiOperation)({ summary: "Delete product" }),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise),
  ],
  ProductController.prototype,
  "delete",
  null,
);
__decorate(
  [
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)(":id/stock"),
    (0, swagger_1.ApiOperation)({ summary: "Adjust stock" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, product_dto_1.AdjustStockDto]),
    __metadata("design:returntype", Promise),
  ],
  ProductController.prototype,
  "adjustStock",
  null,
);
exports.ProductController = ProductController = __decorate(
  [
    (0, swagger_1.ApiTags)("Products"),
    (0, common_1.Controller)("products"),
    (0, common_2.UseGuards)(throttler_1.ThrottlerGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_2.UseInterceptors)(response_envelope_interceptor_1.ResponseEnvelopeInterceptor),
    __metadata("design:paramtypes", [Function]),
  ],
  ProductController,
);
//# sourceMappingURL=product.controller.js.map
