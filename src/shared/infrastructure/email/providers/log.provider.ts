import { Injectable } from '@nestjs/common';
import type {
  IEmailProvider,
  SendEmailOptions,
} from './email-provider.interface';

/** 이메일을 실제로 발송하지 않고 콘솔에 로그로 출력하는 개발용 이메일 프로바이더 */
@Injectable()
export class LogProvider implements IEmailProvider {
  /** 이메일 내용을 콘솔에 출력한다.
   * @param options 이메일 옵션 (수신자, 제목, 본문 등)
   */
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
