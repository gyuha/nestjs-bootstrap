import { Injectable } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type {
  IEmailProvider,
  SendEmailOptions,
} from './email-provider.interface';

@Injectable()
export class SmtpProvider implements IEmailProvider {
  private readonly transporter: nodemailer.Transporter;
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    this.from = this.config.get<string>('EMAIL_FROM') ?? 'noreply@example.com';
    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('SMTP_HOST'),
      port: this.config.get<number>('SMTP_PORT') ?? 587,
      secure: this.config.get<boolean>('SMTP_SECURE') ?? false,
      auth: {
        user: this.config.get<string>('SMTP_USER'),
        pass: this.config.get<string>('SMTP_PASS'),
      },
    });
  }

  async send(options: SendEmailOptions): Promise<void> {
    await this.transporter.sendMail({
      from: this.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
  }
}
