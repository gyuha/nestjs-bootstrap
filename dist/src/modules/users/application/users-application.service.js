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
exports.UsersApplicationService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = require("bcrypt");
const role_value_object_1 = require("../domain/value-objects/role.value-object");
const user_exception_1 = require("../presentation/exceptions/user.exception");
const USER_REPOSITORY = 'USER_REPOSITORY';
let UsersApplicationService = class UsersApplicationService {
    constructor(userRepo) {
        this.userRepo = userRepo;
    }
    async create(dto) {
        const existing = await this.userRepo.findByEmail(dto.email);
        if (existing)
            throw user_exception_1.UserException.emailAlreadyExists();
        const passwordHash = await bcrypt.hash(dto.password, 12);
        const user = {
            id: crypto.randomUUID(),
            email: dto.email,
            passwordHash,
            name: dto.name,
            role: dto.role || role_value_object_1.Role.USER,
            status: role_value_object_1.UserStatus.ACTIVE,
            emailVerified: false,
            lockoutUntil: null,
            failedLoginAttempts: 0,
            verificationToken: null,
            verificationTokenExpiry: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        await this.userRepo.save(user);
        return user;
    }
    async findById(id) {
        const user = await this.userRepo.findById(id);
        if (!user)
            throw user_exception_1.UserException.notFound();
        return user;
    }
    async findAll(query) {
        const page = query.page || 1;
        const limit = query.limit || 20;
        const offset = (page - 1) * limit;
        const allUsers = [];
        return {
            data: allUsers.slice(offset, offset + limit),
            total: allUsers.length,
            page,
            limit,
        };
    }
    async update(id, dto) {
        const user = await this.userRepo.findById(id);
        if (!user)
            throw user_exception_1.UserException.notFound();
        const updated = {
            ...user,
            ...(dto.name && { name: dto.name }),
            ...(dto.role && { role: dto.role }),
            ...(dto.status && { status: dto.status }),
            updatedAt: new Date(),
        };
        await this.userRepo.update(updated);
        return updated;
    }
    async delete(id) {
        const user = await this.userRepo.findById(id);
        if (!user)
            throw user_exception_1.UserException.notFound();
        await this.userRepo.delete(id);
    }
};
exports.UsersApplicationService = UsersApplicationService;
exports.UsersApplicationService = UsersApplicationService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(USER_REPOSITORY)),
    __metadata("design:paramtypes", [Object])
], UsersApplicationService);
//# sourceMappingURL=users-application.service.js.map