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
exports.ChatRequestDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class ChatRequestDto {}
exports.ChatRequestDto = ChatRequestDto;
__decorate(
  [
    (0, swagger_1.ApiProperty)({ description: "The user message to send to the AI" }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String),
  ],
  ChatRequestDto.prototype,
  "message",
  void 0,
);
__decorate(
  [
    (0, swagger_1.ApiPropertyOptional)({ description: "Session ID for conversation tracking" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String),
  ],
  ChatRequestDto.prototype,
  "sessionId",
  void 0,
);
__decorate(
  [
    (0, swagger_1.ApiPropertyOptional)({ description: "User ID for tracking" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String),
  ],
  ChatRequestDto.prototype,
  "userId",
  void 0,
);
__decorate(
  [
    (0, swagger_1.ApiPropertyOptional)({ description: "Model to use", example: "gpt-4o" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String),
  ],
  ChatRequestDto.prototype,
  "model",
  void 0,
);
__decorate(
  [
    (0, swagger_1.ApiPropertyOptional)({ description: "System prompt for context" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String),
  ],
  ChatRequestDto.prototype,
  "systemPrompt",
  void 0,
);
__decorate(
  [
    (0, swagger_1.ApiPropertyOptional)({
      description: "Whether to use RAG for context",
      default: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean),
  ],
  ChatRequestDto.prototype,
  "useRag",
  void 0,
);
__decorate(
  [
    (0, swagger_1.ApiPropertyOptional)({
      description: "Temperature for response generation",
      example: 0.7,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number),
  ],
  ChatRequestDto.prototype,
  "temperature",
  void 0,
);
__decorate(
  [
    (0, swagger_1.ApiPropertyOptional)({ description: "Maximum tokens in response" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number),
  ],
  ChatRequestDto.prototype,
  "maxTokens",
  void 0,
);
__decorate(
  [
    (0, swagger_1.ApiPropertyOptional)({
      description: "Number of top results for RAG",
      default: 5,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number),
  ],
  ChatRequestDto.prototype,
  "topK",
  void 0,
);
//# sourceMappingURL=chat-request.dto.js.map
