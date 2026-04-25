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
exports.DrizzleService = void 0;
const common_1 = require("@nestjs/common");
const postgres_js_1 = require("drizzle-orm/postgres-js");
const postgres_1 = require("postgres");
let DrizzleService = class DrizzleService {
    constructor(env) {
        const connectionString = env.get('DATABASE_URL');
        this.sql = (0, postgres_1.default)(connectionString);
        this.db = (0, postgres_js_1.drizzle)({ client: this.sql });
    }
    async onModuleDestroy() {
        await this.sql.end();
    }
};
exports.DrizzleService = DrizzleService;
exports.DrizzleService = DrizzleService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Function])
], DrizzleService);
//# sourceMappingURL=drizzle.service.js.map