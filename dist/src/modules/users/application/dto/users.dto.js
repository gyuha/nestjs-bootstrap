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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserQueryDto =
  exports.UserResponseDto =
  exports.UpdateUserDto =
  exports.CreateUserDto =
    void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const role_value_object_1 = require("../../domain/value-objects/role.value-object");
class CreateUserDto {}
exports.CreateUserDto = CreateUserDto;
__decorate(
  [
    (0, swagger_1.ApiProperty)({ example: "user@example.com" }),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String),
  ],
  CreateUserDto.prototype,
  "email",
  void 0,
);
__decorate(
  [
    (0, swagger_1.ApiProperty)({ example: "password123" }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String),
  ],
  CreateUserDto.prototype,
  "password",
  void 0,
);
__decorate(
  [
    (0, swagger_1.ApiProperty)({ example: "John Doe" }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String),
  ],
  CreateUserDto.prototype,
  "name",
  void 0,
);
__decorate(
  [
    (0, swagger_1.ApiPropertyOptional)({ enum: role_value_object_1.Role }),
    (0, class_validator_1.IsEnum)(role_value_object_1.Role),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String),
  ],
  CreateUserDto.prototype,
  "role",
  void 0,
);
class UpdateUserDto {}
exports.UpdateUserDto = UpdateUserDto;
__decorate(
  [
    (0, swagger_1.ApiPropertyOptional)({ example: "John Doe" }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String),
  ],
  UpdateUserDto.prototype,
  "name",
  void 0,
);
__decorate(
  [
    (0, swagger_1.ApiPropertyOptional)({ enum: role_value_object_1.Role }),
    (0, class_validator_1.IsEnum)(role_value_object_1.Role),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String),
  ],
  UpdateUserDto.prototype,
  "role",
  void 0,
);
__decorate(
  [
    (0, swagger_1.ApiPropertyOptional)({ enum: role_value_object_1.UserStatus }),
    (0, class_validator_1.IsEnum)(role_value_object_1.UserStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String),
  ],
  UpdateUserDto.prototype,
  "status",
  void 0,
);
class UserResponseDto {}
exports.UserResponseDto = UserResponseDto;
__decorate(
  [(0, swagger_1.ApiProperty)(), __metadata("design:type", String)],
  UserResponseDto.prototype,
  "id",
  void 0,
);
__decorate(
  [(0, swagger_1.ApiProperty)(), __metadata("design:type", String)],
  UserResponseDto.prototype,
  "email",
  void 0,
);
__decorate(
  [(0, swagger_1.ApiProperty)(), __metadata("design:type", String)],
  UserResponseDto.prototype,
  "name",
  void 0,
);
__decorate(
  [(0, swagger_1.ApiProperty)(), __metadata("design:type", String)],
  UserResponseDto.prototype,
  "role",
  void 0,
);
__decorate(
  [(0, swagger_1.ApiProperty)(), __metadata("design:type", String)],
  UserResponseDto.prototype,
  "status",
  void 0,
);
__decorate(
  [(0, swagger_1.ApiProperty)(), __metadata("design:type", Date)],
  UserResponseDto.prototype,
  "createdAt",
  void 0,
);
__decorate(
  [(0, swagger_1.ApiProperty)(), __metadata("design:type", Date)],
  UserResponseDto.prototype,
  "updatedAt",
  void 0,
);
class UserQueryDto {}
exports.UserQueryDto = UserQueryDto;
__decorate(
  [
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String),
  ],
  UserQueryDto.prototype,
  "email",
  void 0,
);
__decorate(
  [
    (0, swagger_1.ApiPropertyOptional)({ enum: role_value_object_1.Role }),
    (0, class_validator_1.IsEnum)(role_value_object_1.Role),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String),
  ],
  UserQueryDto.prototype,
  "role",
  void 0,
);
__decorate(
  [
    (0, swagger_1.ApiPropertyOptional)({ enum: role_value_object_1.UserStatus }),
    (0, class_validator_1.IsEnum)(role_value_object_1.UserStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String),
  ],
  UserQueryDto.prototype,
  "status",
  void 0,
);
__decorate(
  [
    (0, swagger_1.ApiPropertyOptional)({ default: 1 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsPositive)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number),
  ],
  UserQueryDto.prototype,
  "page",
  void 0,
);
__decorate(
  [
    (0, swagger_1.ApiPropertyOptional)({ default: 20 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsPositive)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number),
  ],
  UserQueryDto.prototype,
  "limit",
  void 0,
);
//# sourceMappingURL=users.dto.js.map
