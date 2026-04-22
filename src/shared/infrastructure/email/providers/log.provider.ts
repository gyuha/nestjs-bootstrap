import { Injectable } from '@nestjs/common';
import type {
  IEmailProvider,
  SendEmailOptions,
} from './email-provider.interface';

@Injectable()
export class LogProvider implements IEmailProvider {
  async send(options: SendEmailOptions): Promise<void> {
    console.log('[EmailService - LOG]', {
      to: options.to,
      subject: options.subject,
      html:
        options.html.substring(0, 200) +
        (options.html.length > 200 ? '...' : ''),
    });
  }
}
