"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVerificationEmailHtml = getVerificationEmailHtml;
exports.getVerificationEmailSubject = getVerificationEmailSubject;
function getVerificationEmailHtml(verificationUrl) {
    return `
    <h1>Verify Your Email</h1>
    <p>Click the link below to verify your email address:</p>
    <a href="${verificationUrl}">Verify Email</a>
    <p>This link expires in 24 hours.</p>
  `;
}
function getVerificationEmailSubject() {
    return "[NestJS Bootstrap] Please verify your email";
}
//# sourceMappingURL=verification-email.js.map