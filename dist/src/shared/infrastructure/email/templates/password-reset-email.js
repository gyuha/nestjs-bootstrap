"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPasswordResetEmailHtml = getPasswordResetEmailHtml;
exports.getPasswordResetEmailSubject = getPasswordResetEmailSubject;
function getPasswordResetEmailHtml(resetUrl) {
    return `
    <h1>Reset Your Password</h1>
    <p>Click the link below to reset your password:</p>
    <a href="${resetUrl}">Reset Password</a>
    <p>This link expires in 15 minutes.</p>
  `;
}
function getPasswordResetEmailSubject() {
    return "[NestJS Bootstrap] Reset Your Password";
}
//# sourceMappingURL=password-reset-email.js.map