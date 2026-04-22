import { Global, Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Worker } from 'bullmq';
import Redis from 'ioredis';
import { EMAIL_QUEUE } from '../queue/queue.module';
import { EmailProcessor } from './email.processor';
import { EmailService } from './email.service';
import { EMAIL_PROVIDER } from './email.token';
import { LogProvider } from './providers/log.provider';
import { ResendProvider } from './providers/resend.provider';
import { SmtpProvider } from './providers/smtp.provider';

@Global()
@Module({
  providers: [
    {
      provide: EMAIL_PROVIDER,
      useFactory: (config: ConfigService) => {
        const provider = config.get<string>('EMAIL_PROVIDER') ?? 'log';
        if (provider === 'resend') return new ResendProvider(config);
        if (provider === 'smtp') return new SmtpProvider(config);
        return new LogProvider();
      },
      inject: [ConfigService],
    },
    EmailService,
    EmailProcessor,
    {
      provide: 'EMAIL_WORKER',
      useFactory: (config: ConfigService, processor: EmailProcessor) => {
        const url = config.get<string>('REDIS_URL');
        const connection = url ? new Redis(url) : new Redis();
        const logger = new Logger('EmailWorker');

        const worker = new Worker(
          EMAIL_QUEUE,
          async (job) => {
            return processor.process(job);
          },
          { connection },
        );

        worker.on('completed', (job) => {
          logger.debug(`Job ${job.id} completed (${job.data.type})`);
        });

        worker.on('failed', (job, err) => {
          if (job?.attemptsMade === job?.opts?.attempts) {
            logger.error(`Job ${job?.id} failed permanently: ${err.message}`);
          } else {
            logger.warn(
              `Job ${job?.id} retrying (${job?.attemptsMade}/${job?.opts?.attempts}): ${err.message}`,
            );
          }
        });

        return worker;
      },
      inject: [ConfigService, EmailProcessor],
    },
  ],
  exports: [EmailService],
})
export class EmailModule {}
