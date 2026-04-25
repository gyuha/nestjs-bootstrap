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
exports.MonitoringModule = void 0;
const common_1 = require("@nestjs/common");
const logging_service_1 = require("./application/services/logging.service");
const metrics_service_1 = require("./application/services/metrics.service");
const postgres_log_repository_1 = require("./infrastructure/repositories/postgres-log.repository");
let MonitoringModule = class MonitoringModule {};
exports.MonitoringModule = MonitoringModule;
exports.MonitoringModule = MonitoringModule = __decorate(
  [
    (0, common_1.Module)({
      providers: [
        logging_service_1.LoggingService,
        metrics_service_1.MetricsService,
        postgres_log_repository_1.PostgresLogRepository,
      ],
      exports: [logging_service_1.LoggingService, metrics_service_1.MetricsService],
    }),
  ],
  MonitoringModule,
);
//# sourceMappingURL=monitoring.module.js.map
