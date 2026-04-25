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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditModule = void 0;
const common_1 = require("@nestjs/common");
const drizzle_module_1 = require("../../infrastructure/database/drizzle.module");
const env_service_1 = require("../../config/env.service");
const audit_controller_1 = require("./presentation/controllers/audit.controller");
const audit_access_guard_1 = require("./presentation/guards/audit-access.guard");
const audit_application_service_1 = require("./application/services/audit-application.service");
const drizzle_audit_repository_1 = require("./infrastructure/repositories/drizzle-audit.repository");
const AUDIT_LOG_REPOSITORY = "AUDIT_LOG_REPOSITORY";
let AuditModule = class AuditModule {};
exports.AuditModule = AuditModule;
exports.AuditModule = AuditModule = __decorate(
  [
    (0, common_1.Module)({
      imports: [drizzle_module_1.DrizzleModule],
      controllers: [audit_controller_1.AuditController],
      providers: [
        env_service_1.EnvService,
        audit_application_service_1.AuditApplicationService,
        audit_access_guard_1.AuditAccessGuard,
        {
          provide: AUDIT_LOG_REPOSITORY,
          useClass: drizzle_audit_repository_1.DrizzleAuditRepository,
        },
      ],
      exports: [audit_application_service_1.AuditApplicationService, AUDIT_LOG_REPOSITORY],
    }),
  ],
  AuditModule,
);
//# sourceMappingURL=audit.module.js.map
