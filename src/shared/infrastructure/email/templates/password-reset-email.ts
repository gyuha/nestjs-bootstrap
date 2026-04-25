export function getPasswordResetEmailHtml(resetUrl: string): string {
  return `
    <h1>Reset Your Password</h1>
    <p>Click the link below to reset your password:</p>
    <a href="${resetUrl}">Reset Password</a>
    <p>This link expires in 15 minutes.</p>
  `;
}

export function getPasswordResetEmailSubject(): string {
  return "[NestJS Bootstrap] Reset Your Password";
}