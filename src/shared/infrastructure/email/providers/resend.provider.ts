import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import type { IEmailProvider, SendEmailOptions } from './email-provider.interface';

@Injectable()
export class ResendProvider implements IEmailProvider {
  private readonly client: Resend;
  private readonly from: string;

  constructor(config: ConfigService) {
    this.client = new Resend(config.getOrThrow<string>('RESEND_API_KEY'));
    this.from = config.getOrThrow<string>('EMAIL_FROM');
  }

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
