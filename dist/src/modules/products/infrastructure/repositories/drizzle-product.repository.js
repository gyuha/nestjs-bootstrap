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
exports.DrizzleProductRepository = void 0;
const common_1 = require("@nestjs/common");
const drizzle_orm_1 = require("drizzle-orm");
const products_schema_1 = require("../../../../infrastructure/database/schema/products.schema");
function toProductEntity(result) {
    return {
        id: result.id,
        name: result.name,
        description: result.description ?? null,
        price: parseFloat(result.price),
        quantity: result.quantity,
        lowStockThreshold: result.lowStockThreshold,
        location: result.location ?? null,
        categoryId: result.categoryId ?? null,
        isActive: result.isActive,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
    };
}
let DrizzleProductRepository = class DrizzleProductRepository {
    constructor(db) {
        this.db = db;
    }
    async findById(id) {
        const result = await this.db.db.select().from(products_schema_1.products).where((0, drizzle_orm_1.eq)(products_schema_1.products.id, id)).limit(1);
        return result[0] ? toProductEntity(result[0]) : null;
    }
    async findAll(query) {
        const page = query.page || 1;
        const limit = query.limit || 20;
        const offset = (page - 1) * limit;
        const conditions = [];
        if (query.categoryId)
            conditions.push((0, drizzle_orm_1.eq)(products_schema_1.products.categoryId, query.categoryId));
        if (query.isActive !== undefined)
            conditions.push((0, drizzle_orm_1.eq)(products_schema_1.products.isActive, query.isActive));
        const whereClause = conditions.length > 0 ? (0, drizzle_orm_1.and)(...conditions) : undefined;
        const data = await this.db.db.select().from(products_schema_1.products).where(whereClause).limit(limit).offset(offset);
        const countResult = await this.db.db.select({ count: (0, drizzle_orm_1.sql) `count(*)` }).from(products_schema_1.products).where(whereClause);
        return { data: data.map(toProductEntity), total: countResult[0]?.count ?? 0 };
    }
    async save(entity) {
        const newProduct = {
            name: entity.name,
            description: entity.description,
            price: entity.price.toString(),
            quantity: entity.quantity,
            lowStockThreshold: entity.lowStockThreshold,
            location: entity.location,
            categoryId: entity.categoryId,
            isActive: entity.isActive,
        };
        await this.db.db.insert(products_schema_1.products).values(newProduct);
    }
    async update(entity) {
        const { id, price, ...data } = entity;
        await this.db.db.update(products_schema_1.products).set({ ...data, price: price.toString() }).where((0, drizzle_orm_1.eq)(products_schema_1.products.id, id));
    }
    async delete(id) {
        await this.db.db.delete(products_schema_1.products).where((0, drizzle_orm_1.eq)(products_schema_1.products.id, id));
    }
    async updateStock(id, quantity) {
        await this.db.db.update(products_schema_1.products).set({ quantity, updatedAt: new Date() }).where((0, drizzle_orm_1.eq)(products_schema_1.products.id, id));
    }
};
exports.DrizzleProductRepository = DrizzleProductRepository;
exports.DrizzleProductRepository = DrizzleProductRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Function])
], DrizzleProductRepository);
//# sourceMappingURL=drizzle-product.repository.js.map