export function getMagicLinkEmailHtml(magicLinkUrl: string): string {
  return `
    <h1>Sign In to NestJS Bootstrap</h1>
    <p>Click the link below to sign in:</p>
    <a href="${magicLinkUrl}">Sign In</a>
    <p>This link expires in 15 minutes.</p>
  `;
}

export function getMagicLinkEmailSubject(): string {
  return "[NestJS Bootstrap] Your Magic Link";
}