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
exports.AiAdminController = exports.IndexRequestDto = void 0;
const common_1 = require("@nestjs/common");
const rag_service_1 = require("../../../rag/application/services/rag.service");
const logging_service_1 = require("../../../monitoring/application/services/logging.service");
const metrics_service_1 = require("../../../monitoring/application/services/metrics.service");
class IndexRequestDto {}
exports.IndexRequestDto = IndexRequestDto;
let AiAdminController = class AiAdminController {
  constructor(ragService, loggingService, metricsService) {
    this.ragService = ragService;
    this.loggingService = loggingService;
    this.metricsService = metricsService;
  }
  async indexDocuments(dto) {
    await this.ragService.indexDocuments(dto.source, {
      chunkSize: dto.chunkSize,
      chunkOverlap: dto.chunkOverlap,
      chunkStrategy: dto.chunkStrategy,
    });
    return { success: true };
  }
  async deleteIndexedDocuments(_source) {
    return { success: true };
  }
  async getLogs(filters) {
    const logs = await this.loggingService.findLogs(filters);
    return { data: logs };
  }
  async getMetrics(filters) {
    const metrics = await this.metricsService.aggregateMetrics(filters);
    return { data: metrics };
  }
  async getPrometheusMetrics(filters) {
    const metrics = await this.metricsService.aggregateMetrics(filters);
    return `# HELP ai_total_requests Total AI API requests
# TYPE ai_total_requests counter
ai_total_requests ${metrics.totalRequests}
# HELP ai_total_tokens Total AI tokens used
# TYPE ai_total_tokens counter
ai_total_tokens ${metrics.totalPromptTokens + metrics.totalCompletionTokens}
# HELP ai_cost_total Total AI cost in USD
# TYPE ai_cost_total counter
ai_cost_total ${metrics.costUsd}
# HELP ai_error_rate Error rate percentage
# TYPE ai_error_rate gauge
ai_error_rate ${metrics.errorRate}
# HELP ai_rag_hit_rate RAG hit rate percentage
# TYPE ai_rag_hit_rate gauge
ai_rag_hit_rate ${metrics.ragHitRate}`;
  }
};
exports.AiAdminController = AiAdminController;
__decorate(
  [
    (0, common_1.Post)("index"),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [IndexRequestDto]),
    __metadata("design:returntype", Promise),
  ],
  AiAdminController.prototype,
  "indexDocuments",
  null,
);
__decorate(
  [
    (0, common_1.Delete)("index/:source"),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)("_source")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise),
  ],
  AiAdminController.prototype,
  "deleteIndexedDocuments",
  null,
);
__decorate(
  [
    (0, common_1.Get)("logs"),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise),
  ],
  AiAdminController.prototype,
  "getLogs",
  null,
);
__decorate(
  [
    (0, common_1.Get)("metrics"),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise),
  ],
  AiAdminController.prototype,
  "getMetrics",
  null,
);
__decorate(
  [
    (0, common_1.Get)("metrics/prometheus"),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise),
  ],
  AiAdminController.prototype,
  "getPrometheusMetrics",
  null,
);
exports.AiAdminController = AiAdminController = __decorate(
  [
    (0, common_1.Controller)("api/v1/ai/admin"),
    __metadata("design:paramtypes", [
      rag_service_1.RAGService,
      logging_service_1.LoggingService,
      metrics_service_1.MetricsService,
    ]),
  ],
  AiAdminController,
);
//# sourceMappingURL=ai-admin.controller.js.map
