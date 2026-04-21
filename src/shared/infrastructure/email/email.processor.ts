import { Injectable, Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { EmailService } from './email.service';
import type { EmailJobData } from '../queue/queue.interface';

@Injectable()
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly emailService: EmailService) {}

  async process(job: Job<EmailJobData>): Promise<void> {
    const { type, to, token, ip, userAgent } = job.data;

    this.logger.debug(`Processing email job: ${type} to ${to}`);

    switch (type) {
      case 'signup-confirmation':
        await this.emailService.sendSignupConfirmation(to, token!);
        break;
      case 'welcome':
        await this.emailService.sendWelcome(to);
        break;
      case 'login-alert':
        await this.emailService.sendLoginAlert(to, ip!, userAgent!);
        break;
      case 'password-reset':
        await this.emailService.sendPasswordReset(to, token!);
        break;
      case 'email-change':
        await this.emailService.sendEmailChange(to, token!, '');
        break;
      case 'subscription-confirm':
        await this.emailService.sendSubscriptionConfirmation(to, token!);
        break;
      case 'account-deactivation':
        await this.emailService.sendAccountDeactivationWarning(to);
        break;
      default:
        throw new Error(`Unknown email job type: ${type}`);
    }
  }
}
