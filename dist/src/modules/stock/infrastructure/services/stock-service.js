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
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockService = void 0;
const common_1 = require("@nestjs/common");
const drizzle_orm_1 = require("drizzle-orm");
const products_schema_1 = require("../../../../infrastructure/database/schema/products.schema");
const stock_movements_schema_1 = require("../../../../infrastructure/database/schema/stock-movements.schema");
let StockService = class StockService {
    constructor(db) {
        this.db = db;
    }
    async validateAndDecrementStock(productId, quantity) {
        const result = await this.db.db.select().from(products_schema_1.products).where((0, drizzle_orm_1.eq)(products_schema_1.products.id, productId)).limit(1);
        const product = result[0];
        if (!product)
            throw new Error('Product not found');
        if (!product.isActive)
            throw new Error('Product is not active');
        if (product.quantity < quantity)
            throw new Error('Insufficient stock');
        const newQuantity = product.quantity - quantity;
        await this.db.db.update(products_schema_1.products).set({ quantity: newQuantity, updatedAt: new Date() }).where((0, drizzle_orm_1.eq)(products_schema_1.products.id, productId));
        await this.db.db.insert(stock_movements_schema_1.stockMovements).values({
            productId,
            quantity,
            type: 'OUT',
            reason: 'ORDER',
        });
        return {
            id: product.id,
            name: product.name,
            description: product.description ?? null,
            price: parseFloat(product.price),
            quantity: newQuantity,
            lowStockThreshold: product.lowStockThreshold,
            location: product.location ?? null,
            categoryId: product.categoryId ?? null,
            isActive: product.isActive,
            createdAt: product.createdAt,
            updatedAt: new Date(),
        };
    }
    async incrementStock(productId, quantity) {
        const result = await this.db.db.select().from(products_schema_1.products).where((0, drizzle_orm_1.eq)(products_schema_1.products.id, productId)).limit(1);
        const product = result[0];
        if (!product)
            throw new Error('Product not found');
        const newQuantity = product.quantity + quantity;
        await this.db.db.update(products_schema_1.products).set({ quantity: newQuantity, updatedAt: new Date() }).where((0, drizzle_orm_1.eq)(products_schema_1.products.id, productId));
        await this.db.db.insert(stock_movements_schema_1.stockMovements).values({
            productId,
            quantity,
            type: 'IN',
            reason: 'ORDER_CANCELLED',
        });
    }
};
exports.StockService = StockService;
exports.StockService = StockService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Function])
], StockService);
//# sourceMappingURL=stock-service.js.map