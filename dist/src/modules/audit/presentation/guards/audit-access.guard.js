"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditAccessGuard = void 0;
const common_1 = require("@nestjs/common");
const role_value_object_1 = require("../../../../modules/users/domain/value-objects/role.value-object");
let AuditAccessGuard = class AuditAccessGuard {
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user)
            return false;
        if (user.role === role_value_object_1.Role.ADMIN)
            return true;
        if (!request.query.userId || request.query.userId !== user.id) {
            request.query.userId = user.id;
        }
        return true;
    }
};
exports.AuditAccessGuard = AuditAccessGuard;
exports.AuditAccessGuard = AuditAccessGuard = __decorate([
    (0, common_1.Injectable)()
], AuditAccessGuard);
//# sourceMappingURL=audit-access.guard.js.map