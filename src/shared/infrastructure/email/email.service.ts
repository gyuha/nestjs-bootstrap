import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EMAIL_PROVIDER } from './email.token';
import type { IEmailProvider } from './providers/email-provider.interface';
import { renderSignupConfirmation } from './templates/signup-confirmation.email';
import { renderPasswordReset } from './templates/password-reset.email';
import { renderEmailChange } from './templates/email-change.email';
import { renderLoginAlert } from './templates/login-alert.email';
import { renderSubscriptionConfirm } from './templates/subscription-confirm.email';
import { renderWelcome } from './templates/welcome.email';
import { renderAccountDeactivation } from './templates/account-deactivation.email';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly baseUrl: string;

  constructor(
    @Inject(EMAIL_PROVIDER) private readonly provider: IEmailProvider,
    private readonly config: ConfigService,
  ) {
    this.baseUrl = this.config.getOrThrow<string>('API_BASE_URL');
  }

  async sendSignupConfirmation(to: string, token: string): Promise<void> {
    const url = `${this.baseUrl}/auth/verify-email?token=${token}`;
    await this.trySend(async () => this.provider.send({
      to,
      subject: '이메일 확인',
      html: await renderSignupConfirmation(url),
    }));
  }

  async sendPasswordReset(to: string, token: string): Promise<void> {
    const url = `${this.baseUrl}/auth/reset-password?token=${token}`;
    await this.trySend(async () => this.provider.send({
      to,
      subject: '비밀번호 재설정',
      html: await renderPasswordReset(url),
    }));
  }

  async sendEmailChange(to: string, token: string, newEmail: string): Promise<void> {
    const url = `${this.baseUrl}/auth/verify-email-change?token=${token}`;
    await this.trySend(async () => this.provider.send({
      to,
      subject: '이메일 변경 확인',
      html: await renderEmailChange(url, newEmail),
    }));
  }

  async sendLoginAlert(to: string, ip: string, userAgent: string): Promise<void> {
    await this.trySend(async () => this.provider.send({
      to,
      subject: '새로운 로그인 알림',
      html: await renderLoginAlert(ip, userAgent),
    }));
  }

  async sendSubscriptionConfirmation(to: string, token: string): Promise<void> {
    const url = `${this.baseUrl}/auth/subscribe/confirm?token=${token}`;
    await this.trySend(async () => this.provider.send({
      to,
      subject: '마케팅 수신 동의 확인',
      html: await renderSubscriptionConfirm(url),
    }));
  }

  async sendWelcome(to: string, name?: string): Promise<void> {
    await this.trySend(async () => this.provider.send({
      to,
      subject: '환영합니다!',
      html: await renderWelcome(name),
    }));
  }

  async sendAccountDeactivationWarning(to: string): Promise<void> {
    await this.trySend(async () => this.provider.send({
      to,
      subject: '계정 비활성화 예정 안내',
      html: await renderAccountDeactivation(),
    }));
  }

  private async trySend(fn: () => Promise<void>): Promise<void> {
    try {
      await fn();
    } catch (err) {
      this.logger.error('Email delivery failed', err);
    }
  }
}
