"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductApplicationService = void 0;
const common_1 = require("@nestjs/common");
const PRODUCT_REPOSITORY = 'PRODUCT_REPOSITORY';
let ProductApplicationService = class ProductApplicationService {
    constructor(productRepo) {
        this.productRepo = productRepo;
    }
    async create(dto) {
        const product = {
            id: crypto.randomUUID(),
            name: dto.name,
            description: dto.description ?? null,
            price: dto.price,
            quantity: dto.quantity,
            lowStockThreshold: dto.lowStockThreshold ?? 10,
            location: dto.location ?? null,
            categoryId: dto.categoryId ?? null,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        await this.productRepo.save(product);
        return product;
    }
    async findById(id) {
        return this.productRepo.findById(id);
    }
    async findAll(query) {
        return this.productRepo.findAll(query);
    }
    async update(id, dto) {
        const product = await this.productRepo.findById(id);
        if (!product)
            throw new Error('Product not found');
        const updated = { ...product, ...dto, updatedAt: new Date() };
        await this.productRepo.update(updated);
        return updated;
    }
    async delete(id) {
        await this.productRepo.delete(id);
    }
    async adjustStock(id, quantity) {
        const product = await this.productRepo.findById(id);
        if (!product)
            throw new Error('Product not found');
        const newQuantity = product.quantity + quantity;
        if (newQuantity < 0)
            throw new Error('Insufficient stock');
        await this.productRepo.updateStock(id, newQuantity);
        return { ...product, quantity: newQuantity };
    }
};
exports.ProductApplicationService = ProductApplicationService;
exports.ProductApplicationService = ProductApplicationService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(PRODUCT_REPOSITORY)),
    __metadata("design:paramtypes", [Object])
], ProductApplicationService);
//# sourceMappingURL=product-application.service.js.map