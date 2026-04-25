"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMagicLinkEmailHtml = getMagicLinkEmailHtml;
exports.getMagicLinkEmailSubject = getMagicLinkEmailSubject;
function getMagicLinkEmailHtml(magicLinkUrl) {
    return `
    <h1>Sign In to NestJS Bootstrap</h1>
    <p>Click the link below to sign in:</p>
    <a href="${magicLinkUrl}">Sign In</a>
    <p>This link expires in 15 minutes.</p>
  `;
}
function getMagicLinkEmailSubject() {
    return "[NestJS Bootstrap] Your Magic Link";
}
//# sourceMappingURL=magic-link-email.js.map