import { Injectable, Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import type { EmailJobData } from '../queue/queue.interface';
import { EmailService } from './email.service';

/** BullMQ 이메일 작업을 처리하여 유형별 이메일 발송 메서드를 호출하는 프로세서 */
@Injectable()
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly emailService: EmailService) {}

  /** 이메일 작업 유형에 따라 적절한 이메일 발송 메서드를 호출한다.
   * @param job 처리할 BullMQ 이메일 작업
   */
  async process(job: Job<EmailJobData>): Promise<void> {
    const { type, to, token, ip, userAgent } = job.data;

    this.logger.debug(`Processing email job: ${type} to ${to}`);

    switch (type) {
      case 'signup-confirmation':
        await this.emailService.sendSignupConfirmation(
          to,
          this.requireField(token, 'token'),
        );
        break;
      case 'welcome':
        await this.emailService.sendWelcome(to);
        break;
      case 'login-alert':
        await this.emailService.sendLoginAlert(
          to,
          this.requireField(ip, 'ip'),
          this.requireField(userAgent, 'userAgent'),
        );
        break;
      case 'password-reset':
        await this.emailService.sendPasswordReset(
          to,
          this.requireField(token, 'token'),
        );
        break;
      case 'email-change':
        await this.emailService.sendEmailChange(
          to,
          this.requireField(token, 'token'),
          '',
        );
        break;
      case 'subscription-confirm':
        await this.emailService.sendSubscriptionConfirmation(
          to,
          this.requireField(token, 'token'),
        );
        break;
      case 'account-deactivation':
        await this.emailService.sendAccountDeactivationWarning(to);
        break;
      default:
        throw new Error(`Unknown email job type: ${type}`);
    }
  }

  private requireField(value: string | undefined, name: string): string {
    if (!value) throw new Error(`Email job is missing required field: ${name}`);
    return value;
  }
}
