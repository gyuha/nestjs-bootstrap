"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLog = exports.AUDIT_EVENT_TYPE_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.AUDIT_EVENT_TYPE_KEY = "auditEventType";
const AuditLog = (eventType) => {
  return (0, common_1.SetMetadata)(exports.AUDIT_EVENT_TYPE_KEY, eventType);
};
exports.AuditLog = AuditLog;
//# sourceMappingURL=audit-log.decorator.js.map
