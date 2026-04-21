# Phase 6 Background Job Queue Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 이메일 발송을 비동기 잡 큐로 전환한다. BullMQ 기반으로 재시도, 로깅, Bull Board 대시보드를 제공한다.

**Architecture:** `QueueModule`(@Global)이 BullMQ Queue를 관리한다. `EmailProcessor`가 이메일 큐의 잡을 처리하여 `EmailService` 호출. `AuthService`는 직접 `EmailService` 대신 `QueueService.addJob` 사용.

**Tech Stack:** bullmq, @bull-board/api, @bull-board/nestjs

---

## 파일 구조 맵

```
# 새로 생성
src/shared/infrastructure/queue/
├── queue.module.ts
├── queue.service.ts
├── queue.service.spec.ts
├── queue.token.ts
└── queue.interface.ts

src/shared/infrastructure/email/
└── email.processor.ts
└── email.processor.spec.ts

src/bootstrap/admin/
└── bull-board.setup.ts

# 수정
src/bootstrap/validation/env.schema.ts      ← BULL_BOARD_ENABLED 추가
.env.development                           ← BULL_BOARD_ENABLED=true 추가
src/modules/auth/auth.service.ts           ← emailService → queueService
src/shared/infrastructure/email/email.module.ts ← EmailProcessor 등록
src/app.module.ts                          ← QueueModule 추가
src/main.ts                                ← Bull Board 설정 호출
```

---

## Task 1: 패키지 설치

**Files:**
- Modify: `package.json`

- [ ] **Step 1: BullMQ + Bull Board 패키지 설치**

```bash
bun add bullmq @bull-board/api @bull-board/nestjs
```

- [ ] **Step 2: 커밋**

```bash
git add package.json bun.lock
git commit -m "chore: add bullmq and bull-board packages"
```

---

## Task 2: 환경변수 스키마 업데이트

**Files:**
- Modify: `src/bootstrap/validation/env.schema.ts`
- Modify: `.env.development`

- [ ] **Step 1: env.schema.ts에 BULL_BOARD_ENABLED 추가**

`src/bootstrap/validation/env.schema.ts`의 `AWS_S3_PUBLIC_URL` 줄 뒤에 추가:

```typescript
BULL_BOARD_ENABLED: z.string().default('false').transform(v => v === 'true'),
```

- [ ] **Step 2: .env.development에 추가**

`.env.development` 파일 끝에 추가:

```env

# Queue
BULL_BOARD_ENABLED=true
```

- [ ] **Step 3: env 스키마 테스트 실행**

```bash
bun run test --testPathPatterns=env.schema
```

Expected: PASS

- [ ] **Step 4: 커밋**

```bash
git add src/bootstrap/validation/env.schema.ts .env.development
git commit -m "feat: add BULL_BOARD_ENABLED env variable"
```

---

## Task 3: Queue 인터페이스 + 토큰

**Files:**
- Create: `src/shared/infrastructure/queue/queue.interface.ts`
- Create: `src/shared/infrastructure/queue/queue.token.ts`

- [ ] **Step 1: 디렉토리 생성**

```bash
mkdir -p src/shared/infrastructure/queue
```

- [ ] **Step 2: queue.interface.ts 생성**

`src/shared/infrastructure/queue/queue.interface.ts`:

```typescript
export type EmailJobType =
  | 'signup-confirmation'
  | 'welcome'
  | 'login-alert'
  | 'password-reset'
  | 'email-change'
  | 'subscription-confirm'
  | 'account-deactivation';

export interface EmailJobData {
  type: EmailJobType;
  to: string;
  token?: string;
  ip?: string;
  userAgent?: string;
}
```

- [ ] **Step 3: queue.token.ts 생성**

`src/shared/infrastructure/queue/queue.token.ts`:

```typescript
export const QUEUE_TOKEN = 'QUEUE_TOKEN';
```

- [ ] **Step 4: 커밋**

```bash
git add src/shared/infrastructure/queue/
git commit -m "feat: add queue interface types and token"
```

---

## Task 4: QueueService (TDD)

**Files:**
- Create: `src/shared/infrastructure/queue/queue.service.ts`
- Create: `src/shared/infrastructure/queue/queue.service.spec.ts`

- [ ] **Step 1: queue.service.spec.ts 작성 (TDD)**

`src/shared/infrastructure/queue/queue.service.spec.ts`:

```typescript
import { Test } from '@nestjs/testing';
import { QueueService } from './queue.service';
import { QUEUE_TOKEN } from './queue.token';

describe('QueueService', () => {
  let service: QueueService;
  let mockQueue: { add: jest.Mock };

  beforeEach(async () => {
    mockQueue = { add: jest.fn().mockResolvedValue({ id: '1' }) };

    const module = await Test.createTestingModule({
      providers: [
        QueueService,
        { provide: QUEUE_TOKEN, useValue: mockQueue },
      ],
    }).compile();

    service = module.get(QueueService);
  });

  describe('addJob()', () => {
    it('adds job to the queue with retry config', async () => {
      const data = { type: 'signup-confirmation', to: 'test@example.com', token: 'abc' };

      await service.addJob('email', data);

      expect(mockQueue.add).toHaveBeenCalledWith('email', data, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      });
    });
  });
});
```

- [ ] **Step 2: 테스트 실행 (실패 확인)**

```bash
bun run test --testPathPatterns=queue.service
```

Expected: FAIL

- [ ] **Step 3: queue.service.ts 구현**

`src/shared/infrastructure/queue/queue.service.ts`:

```typescript
import { Inject, Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { QUEUE_TOKEN } from './queue.token';

@Injectable()
export class QueueService {
  constructor(
    @Inject(QUEUE_TOKEN) private readonly queue: Queue,
  ) {}

  async addJob(name: string, data: unknown): Promise<void> {
    await this.queue.add(name, data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
    });
  }
}
```

- [ ] **Step 4: 테스트 재실행 (통과 확인)**

```bash
bun run test --testPathPatterns=queue.service
```

Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add src/shared/infrastructure/queue/queue.service.ts src/shared/infrastructure/queue/queue.service.spec.ts
git commit -m "feat: add QueueService with retry and backoff"
```

---

## Task 5: EmailProcessor (TDD)

**Files:**
- Create: `src/shared/infrastructure/email/email.processor.ts`
- Create: `src/shared/infrastructure/email/email.processor.spec.ts`

- [ ] **Step 1: email.processor.spec.ts 작성 (TDD)**

`src/shared/infrastructure/email/email.processor.spec.ts`:

```typescript
import { EmailProcessor } from './email.processor';
import { EmailService } from './email.service';

describe('EmailProcessor', () => {
  let processor: EmailProcessor;
  let mockEmailService: {
    sendSignupConfirmation: jest.Mock;
    sendWelcome: jest.Mock;
    sendLoginAlert: jest.Mock;
    sendPasswordReset: jest.Mock;
    sendSubscriptionConfirmation: jest.Mock;
    sendAccountDeactivationWarning: jest.Mock;
  };

  beforeEach(() => {
    mockEmailService = {
      sendSignupConfirmation: jest.fn().mockResolvedValue(undefined),
      sendWelcome: jest.fn().mockResolvedValue(undefined),
      sendLoginAlert: jest.fn().mockResolvedValue(undefined),
      sendPasswordReset: jest.fn().mockResolvedValue(undefined),
      sendSubscriptionConfirmation: jest.fn().mockResolvedValue(undefined),
      sendAccountDeactivationWarning: jest.fn().mockResolvedValue(undefined),
    };

    processor = new EmailProcessor(mockEmailService as any);
  });

  it('processes signup-confirmation job', async () => {
    await processor.process({ data: { type: 'signup-confirmation', to: 'test@example.com', token: 'abc' } } as any);

    expect(mockEmailService.sendSignupConfirmation).toHaveBeenCalledWith('test@example.com', 'abc');
  });

  it('processes welcome job', async () => {
    await processor.process({ data: { type: 'welcome', to: 'test@example.com' } } as any);

    expect(mockEmailService.sendWelcome).toHaveBeenCalledWith('test@example.com');
  });

  it('processes login-alert job', async () => {
    await processor.process({ data: { type: 'login-alert', to: 'test@example.com', ip: '1.2.3.4', userAgent: 'chrome' } } as any);

    expect(mockEmailService.sendLoginAlert).toHaveBeenCalledWith('test@example.com', '1.2.3.4', 'chrome');
  });

  it('processes password-reset job', async () => {
    await processor.process({ data: { type: 'password-reset', to: 'test@example.com', token: 'xyz' } } as any);

    expect(mockEmailService.sendPasswordReset).toHaveBeenCalledWith('test@example.com', 'xyz');
  });

  it('processes subscription-confirm job', async () => {
    await processor.process({ data: { type: 'subscription-confirm', to: 'test@example.com', token: 'sub' } } as any);

    expect(mockEmailService.sendSubscriptionConfirmation).toHaveBeenCalledWith('test@example.com', 'sub');
  });

  it('processes account-deactivation job', async () => {
    await processor.process({ data: { type: 'account-deactivation', to: 'test@example.com' } } as any);

    expect(mockEmailService.sendAccountDeactivationWarning).toHaveBeenCalledWith('test@example.com');
  });

  it('throws on unknown email type', async () => {
    await expect(
      processor.process({ data: { type: 'unknown', to: 'test@example.com' } } as any),
    ).rejects.toThrow('Unknown email job type: unknown');
  });
});
```

- [ ] **Step 2: 테스트 실행 (실패 확인)**

```bash
bun run test --testPathPatterns=email.processor
```

Expected: FAIL

- [ ] **Step 3: email.processor.ts 구현**

`src/shared/infrastructure/email/email.processor.ts`:

```typescript
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
```

- [ ] **Step 4: 테스트 재실행 (통과 확인)**

```bash
bun run test --testPathPatterns=email.processor
```

Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add src/shared/infrastructure/email/email.processor.ts src/shared/infrastructure/email/email.processor.spec.ts
git commit -m "feat: add EmailProcessor for async email job handling"
```

---

## Task 6: QueueModule

**Files:**
- Create: `src/shared/infrastructure/queue/queue.module.ts`
- Modify: `src/shared/infrastructure/email/email.module.ts`
- Modify: `src/app.module.ts`

- [ ] **Step 1: queue.module.ts 생성**

`src/shared/infrastructure/queue/queue.module.ts`:

```typescript
import { Global, Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue, Worker } from 'bullmq';
import { QUEUE_TOKEN } from './queue.token';
import { QueueService } from './queue.service';

export const EMAIL_QUEUE = 'email';

@Global()
@Module({
  providers: [
    {
      provide: QUEUE_TOKEN,
      useFactory: (config: ConfigService) => {
        const url = config.get<string>('REDIS_URL');
        const connection = url ? { url } : undefined;
        return new Queue(EMAIL_QUEUE, { connection });
      },
      inject: [ConfigService],
    },
    QueueService,
  ],
  exports: [QueueService],
})
export class QueueModule {}
```

- [ ] **Step 2: EmailModule에 EmailProcessor 등록**

`src/shared/infrastructure/email/email.module.ts`를 수정. 기존 내용을 다음으로 교체:

```typescript
import { Global, Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Worker } from 'bullmq';
import { EmailService } from './email.service';
import { EMAIL_PROVIDER } from './email.token';
import { LogProvider } from './providers/log.provider';
import { ResendProvider } from './providers/resend.provider';
import { SmtpProvider } from './providers/smtp.provider';
import { EmailProcessor } from './email.processor';
import { EMAIL_QUEUE } from '../queue/queue.module';

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
        const connection = url ? { url } : undefined;
        const logger = new Logger('EmailWorker');

        const worker = new Worker(EMAIL_QUEUE, async (job) => {
          return processor.process(job);
        }, { connection });

        worker.on('completed', (job) => {
          logger.debug(`Job ${job.id} completed (${job.data.type})`);
        });

        worker.on('failed', (job, err) => {
          if (job?.attemptsMade === job?.opts?.attempts) {
            logger.error(`Job ${job?.id} failed permanently: ${err.message}`);
          } else {
            logger.warn(`Job ${job?.id} retrying (${job?.attemptsMade}/${job?.opts?.attempts}): ${err.message}`);
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
```

- [ ] **Step 3: app.module.ts에 QueueModule 추가**

`src/app.module.ts`의 import 섹션에 추가:

```typescript
import { QueueModule } from './shared/infrastructure/queue/queue.module';
```

imports 배열에 `QueueModule,`을 `EmailModule,` 앞에 추가 (QueueModule이 EmailModule보다 먼저 로드되어야 함).

- [ ] **Step 4: 빌드 확인**

```bash
bun run build
```

Expected: 성공

- [ ] **Step 5: 커밋**

```bash
git add src/shared/infrastructure/queue/queue.module.ts src/shared/infrastructure/email/email.module.ts src/app.module.ts
git commit -m "feat: add QueueModule and register EmailProcessor as BullMQ worker"
```

---

## Task 7: AuthService 큐 전환

**Files:**
- Modify: `src/modules/auth/auth.service.ts`

- [ ] **Step 1: AuthService 수정**

`src/modules/auth/auth.service.ts`에서:

1. import 변경 — `EmailService` import를 `QueueService` import로 교체:

```typescript
import { QueueService } from '../../shared/infrastructure/queue/queue.service';
```

`EmailService` import 줄을 삭제.

2. constructor 수정 — `private readonly emailService: EmailService`를 `private readonly queueService: QueueService`로 교체

3. 모든 `void this.emailService.send*(...)` 호출을 큐 잡으로 교체:

라인 35-36 (register 메서드):
```typescript
    void this.queueService.addJob('email', { type: 'signup-confirmation', to: user.email, token: verifyToken });
    void this.queueService.addJob('email', { type: 'welcome', to: user.email });
```

라인 42 (login 메서드):
```typescript
    void this.queueService.addJob('email', { type: 'login-alert', to: user.email, ip, userAgent });
```

라인 60 (forgotPassword 메서드):
```typescript
    void this.queueService.addJob('email', { type: 'password-reset', to: user.email, token });
```

라인 86 (subscribeMarketing 메서드):
```typescript
    void this.queueService.addJob('email', { type: 'subscription-confirm', to: user.email, token });
```

- [ ] **Step 2: AuthModule에 QueueService 주입 확인**

`src/modules/auth/auth.module.ts`를 읽어서 QueueService가 주입 가능한지 확인. QueueModule이 @Global()이므로 자동 주입됨. 추가 설정 불필요.

- [ ] **Step 3: 빌드 확인**

```bash
bun run build
```

Expected: 성공

- [ ] **Step 4: 커밋**

```bash
git add src/modules/auth/auth.service.ts
git commit -m "feat: switch AuthService email sending to async job queue"
```

---

## Task 8: Bull Board 대시보드

**Files:**
- Create: `src/bootstrap/admin/bull-board.setup.ts`
- Modify: `src/main.ts`

- [ ] **Step 1: 디렉토리 생성**

```bash
mkdir -p src/bootstrap/admin
```

- [ ] **Step 2: bull-board.setup.ts 생성**

`src/bootstrap/admin/bull-board.setup.ts`:

```typescript
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { QUEUE_TOKEN } from '../../shared/infrastructure/queue/queue.token';
import { Queue } from 'bullmq';

export function setupBullBoard(app: INestApplication): void {
  const config = app.get(ConfigService);
  const enabled = config.get<string>('BULL_BOARD_ENABLED');

  if (enabled !== 'true') return;

  const queue = app.get<Queue>(QUEUE_TOKEN);
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/admin/queues');

  createBullBoard({
    queues: [new BullMQAdapter(queue)],
    serverAdapter,
  });

  app.use('/admin/queues', serverAdapter.getRouter());
}
```

- [ ] **Step 3: main.ts에 Bull Board 설정 추가**

`src/main.ts`에 import 추가:

```typescript
import { setupBullBoard } from './bootstrap/admin/bull-board.setup';
```

`setupSwagger(app)` 블록 뒤에 추가:

```typescript
  setupBullBoard(app);
```

- [ ] **Step 4: 빌드 확인**

```bash
bun run build
```

Expected: 성공

- [ ] **Step 5: 커밋**

```bash
git add src/bootstrap/admin/ src/main.ts
git commit -m "feat: add Bull Board dashboard for job monitoring"
```

---

## Task 9: 전체 테스트 실행 + 최종 확인

**Files:**
- None (verification only)

- [ ] **Step 1: 전체 단위 테스트 실행**

```bash
bun run test
```

Expected: 모든 테스트 통과

- [ ] **Step 2: 빌드 확인**

```bash
bun run build
```

Expected: 성공

- [ ] **Step 3: Biome lint 확인**

```bash
bunx biome check src/
```

Expected: 통과 (또는 자동 수정 가능한 경고만)

---

## 수용 기준 체크리스트

- [ ] 이메일 발송이 모두 큐를 경유하여 비동기 처리
- [ ] 이메일 발송 실패 시 자동 재시도 (3회, 지수 백오프)
- [ ] 잡 성공/실패/재시도 이벤트가 Pino 로거에 기록
- [ ] Bull Board 대시보드가 `/admin/queues`에서 확인 가능 (dev only)
- [ ] AuthService에서 직접 EmailService 호출 제거, 모두 큐 경유
- [ ] 기존 API 엔드포인트 동작 변화 없음
- [ ] 모든 단위 테스트 통과
- [ ] Biome lint/format 통과
