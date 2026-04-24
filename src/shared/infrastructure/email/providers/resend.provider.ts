import { Injectable } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import type {
  IEmailProvider,
  SendEmailOptions,
} from './email-provider.interface';

/** Resend API를 사용하여 이메일을 발송하는 프로덕션용 이메일 프로바이더 */
@Injectable()
export class ResendProvider implements IEmailProvider {
  private readonly client: Resend;
  private readonly from: string;

  constructor(config: ConfigService) {
    this.client = new Resend(config.getOrThrow<string>('RESEND_API_KEY'));
    this.from = config.getOrThrow<string>('EMAIL_FROM');
  }

  /** Resend API를 통해 이메일을 발송한다.
   * @param options 이메일 옵션 (수신자, 제목, 본문 등)
   */
  async send(options: SendEmailOptions): Promise<void> {
    const { error } = await this.client.emails.send({
      from: this.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    if (error) {
      throw new Error(`Email delivery failed: ${error.message}`);
    }
  }
}
