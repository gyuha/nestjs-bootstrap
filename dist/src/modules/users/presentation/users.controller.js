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
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const users_dto_1 = require("../application/dto/users.dto");
const roles_decorator_1 = require("../../auth/presentation/decorators/roles.decorator");
const roles_guard_1 = require("../../auth/presentation/guards/roles.guard");
const jwt_auth_guard_1 = require("../../auth/presentation/guards/jwt-auth.guard");
const response_envelope_interceptor_1 = require("../../../shared/presentation/interceptors/response-envelope.interceptor");
let UsersController = class UsersController {
    constructor(usersService) {
        this.usersService = usersService;
    }
    async create(dto) {
        const user = await this.usersService.create(dto);
        return user;
    }
    async findAll(query) {
        return this.usersService.findAll(query);
    }
    async findById(id) {
        const user = await this.usersService.findById(id);
        return user;
    }
    async update(id, dto) {
        const user = await this.usersService.update(id, dto);
        return user;
    }
    async delete(id) {
        await this.usersService.delete(id);
        return { message: 'User deleted successfully' };
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new user (ADMIN only)' }),
    (0, swagger_1.ApiResponse)({ status: 201, type: users_dto_1.UserResponseDto }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'List all users (ADMIN only)' }),
    (0, swagger_1.ApiResponse)({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: users_dto_1.UserResponseDto }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "findById", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Update user (ADMIN only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: users_dto_1.UserResponseDto }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Function]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete user (ADMIN only)' }),
    (0, swagger_1.ApiResponse)({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "delete", null);
exports.UsersController = UsersController = __decorate([
    (0, swagger_1.ApiTags)('Users'),
    (0, common_1.Controller)('users'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiNotFoundResponse)({ description: 'User not found' }),
    (0, swagger_1.ApiConflictResponse)({ description: 'Email already exists' }),
    (0, swagger_1.ApiForbiddenResponse)({ description: 'Forbidden' }),
    (0, common_1.UseInterceptors)(response_envelope_interceptor_1.ResponseEnvelopeInterceptor),
    __metadata("design:paramtypes", [Function])
], UsersController);
//# sourceMappingURL=users.controller.js.map