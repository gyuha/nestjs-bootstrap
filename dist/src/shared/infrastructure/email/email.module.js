"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailModule = void 0;
const common_1 = require("@nestjs/common");
const env_service_1 = require("../../../config/env.service");
const console_email_service_1 = require("./console-email.service");
const smtp_email_service_1 = require("./smtp-email.service");
const EMAIL_SERVICE = 'EMAIL_SERVICE';
let EmailModule = class EmailModule {
};
exports.EmailModule = EmailModule;
exports.EmailModule = EmailModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        providers: [
            {
                provide: EMAIL_SERVICE,
                useFactory: (env) => {
                    const provider = env.get('EMAIL_PROVIDER');
                    if (provider === 'smtp') {
                        return new smtp_email_service_1.SmtpEmailService(env);
                    }
                    return new console_email_service_1.ConsoleEmailService();
                },
                inject: [env_service_1.EnvService],
            },
        ],
        exports: [EMAIL_SERVICE],
    })
], EmailModule);
//# sourceMappingURL=email.module.js.map