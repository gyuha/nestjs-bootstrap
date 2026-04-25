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
exports.SmtpEmailService = void 0;
const common_1 = require("@nestjs/common");
const nodemailer = require("nodemailer");
let SmtpEmailService = class SmtpEmailService {
    constructor(env) {
        this.env = env;
        this.transporter = nodemailer.createTransport({
            host: this.env.get("SMTP_HOST"),
            port: parseInt(this.env.get("SMTP_PORT") || "587", 10),
            secure: false,
            auth: {
                user: this.env.get("SMTP_USER"),
                pass: this.env.get("SMTP_PASS"),
            },
        });
    }
    async send(options) {
        await this.transporter.sendMail({
            from: this.env.get("EMAIL_FROM"),
            to: options.to,
            subject: options.subject,
            html: options.html,
            text: options.text,
        });
    }
};
exports.SmtpEmailService = SmtpEmailService;
exports.SmtpEmailService = SmtpEmailService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Function])
], SmtpEmailService);
//# sourceMappingURL=smtp-email.service.js.map