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
exports.AuditApplicationService = void 0;
const common_1 = require("@nestjs/common");
const AUDIT_LOG_REPOSITORY = "AUDIT_LOG_REPOSITORY";
const CLEANUP_THRESHOLD_DAYS = 30;
let AuditApplicationService = class AuditApplicationService {
  constructor(auditRepo, env) {
    this.auditRepo = auditRepo;
    this.env = env;
  }
  async logEvent(params) {
    const entity = {
      id: crypto.randomUUID(),
      userId: params.userId,
      actorType: params.actorType,
      eventType: params.eventType,
      targetResource: params.targetResource ?? null,
      eventData: params.eventData ?? null,
      ipAddress: params.ipAddress ?? null,
      userAgent: params.userAgent ?? null,
      createdAt: new Date(),
    };
    await this.auditRepo.save(entity);
  }
  async queryLogs(filter) {
    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const result = await this.auditRepo.query({ ...filter, page, limit });
    return { ...result, page, limit };
  }
  async cleanupOldLogs() {
    const thresholdDate = new Date(Date.now() - CLEANUP_THRESHOLD_DAYS * 24 * 60 * 60 * 1000);
    return this.auditRepo.deleteOlderThan(thresholdDate);
  }
};
exports.AuditApplicationService = AuditApplicationService;
exports.AuditApplicationService = AuditApplicationService = __decorate(
  [
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(AUDIT_LOG_REPOSITORY)),
    __metadata("design:paramtypes", [Object, Function]),
  ],
  AuditApplicationService,
);
//# sourceMappingURL=audit-application.service.js.map
