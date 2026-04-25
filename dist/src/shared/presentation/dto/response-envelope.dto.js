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
exports.ErrorResponseDto = exports.ErrorDetailDto = exports.ResponseEnvelopeDto = exports.ResponseMetaDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class ResponseMetaDto {
}
exports.ResponseMetaDto = ResponseMetaDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ResponseMetaDto.prototype, "traceId", void 0);
class ResponseEnvelopeDto {
}
exports.ResponseEnvelopeDto = ResponseEnvelopeDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Object)
], ResponseEnvelopeDto.prototype, "data", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: ResponseMetaDto }),
    __metadata("design:type", ResponseMetaDto)
], ResponseEnvelopeDto.prototype, "meta", void 0);
class ErrorDetailDto {
}
exports.ErrorDetailDto = ErrorDetailDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ErrorDetailDto.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ErrorDetailDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: Object, required: false }),
    __metadata("design:type", Object)
], ErrorDetailDto.prototype, "details", void 0);
class ErrorResponseDto {
}
exports.ErrorResponseDto = ErrorResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: ErrorDetailDto }),
    __metadata("design:type", ErrorDetailDto)
], ErrorResponseDto.prototype, "error", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: ResponseMetaDto }),
    __metadata("design:type", ResponseMetaDto)
], ErrorResponseDto.prototype, "meta", void 0);
//# sourceMappingURL=response-envelope.dto.js.map