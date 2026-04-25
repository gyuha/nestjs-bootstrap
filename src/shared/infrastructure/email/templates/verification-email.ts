export function getVerificationEmailHtml(verificationUrl: string): string {
  return `
    <h1>Verify Your Email</h1>
    <p>Click the link below to verify your email address:</p>
    <a href="${verificationUrl}">Verify Email</a>
    <p>This link expires in 24 hours.</p>
  `;
}

export function getVerificationEmailSubject(): string {
  return "[NestJS Bootstrap] Please verify your email";
}