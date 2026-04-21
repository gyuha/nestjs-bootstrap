# Phase 4 Email Service Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 트랜잭션·알림·마케팅 이메일 서비스를 구축한다 — Resend/SMTP/Log provider 전환 가능, React Email TSX 템플릿 7종, Redis 기반 토큰 관리, 비밀번호 재설정·이메일 확인·마케팅 구독 플로우.

**Architecture:** `EmailModule`(Global)이 `IEmailProvider` 전략 패턴으로 provider를 주입한다. 각 템플릿 `.tsx`는 React Element를 반환하는 컴포넌트와 HTML 문자열을 반환하는 `render*()` 헬퍼를 함께 export한다. `EmailService`는 `.ts`에서 헬퍼를 호출해 JSX를 직접 다루지 않는다. 토큰은 `email:{purpose}:{token}` 키로 Redis에 저장하며, Phase 6(큐) 연동 시 `IEmailProvider.send()` 구현체만 교체하면 된다.

**Tech Stack:** resend, nodemailer, @react-email/render, @react-email/components, react, @types/react

---

## 파일 구조 맵

```
# 새로 생성
src/shared/infrastructure/email/
├── email.module.ts
├── email.service.ts
├── email.token.ts
├── providers/
│   ├── email-provider.interface.ts
│   ├── log.provider.ts
│   ├── resend.provider.ts
│   └── smtp.provider.ts
└── templates/
    ├── base.layout.tsx
    ├── signup-confirmation.email.tsx
    ├── password-reset.email.tsx
    ├── email-change.email.tsx
    ├── login-alert.email.tsx
    ├── subscription-confirm.email.tsx
    ├── welcome.email.tsx
    └── account-deactivation.email.tsx

# 수정
tsconfig.json                        ← jsx 옵션 추가
drizzle.config.ts                    ← schema 경로 수정
src/modules/users/schemas/user.schema.ts   ← isEmailVerified, isMarketingSubscribed 추가
src/bootstrap/validation/env.schema.ts     ← EMAIL_* 환경변수 추가
src/modules/auth/auth.service.ts           ← 이메일 발송 연동, 토큰 메서드 추가
src/modules/auth/auth.controller.ts        ← 신규 엔드포인트 추가
src/modules/auth/auth.module.ts            ← EmailModule import 추가
src/modules/users/users.service.ts         ← setEmailVerified, updatePassword 등 추가
src/app.module.ts                          ← EmailModule 추가
package.json                               ← db:push script 추가

# 신규 DTOs
src/modules/auth/dto/forgot-password.dto.ts
src/modules/auth/dto/reset-password.dto.ts
src/modules/auth/dto/subscribe.dto.ts

# 테스트
src/shared/infrastructure/email/providers/log.provider.spec.ts
src/shared/infrastructure/email/providers/resend.provider.spec.ts
src/shared/infrastructure/email/providers/smtp.provider.spec.ts
src/shared/infrastructure/email/email.service.spec.ts
test/auth-email.e2e-spec.ts
```

---

## Task 1: 패키지 설치 및 TSX 설정

**Files:**
- Modify: `package.json`
- Modify: `tsconfig.json`

- [ ] **Step 1: 이메일 관련 패키지 설치**

```bash
bun add resend nodemailer @react-email/render @react-email/components react
```

- [ ] **Step 2: 타입 정의 설치**

```bash
bun add -d @types/nodemailer @types/react
```

- [ ] **Step 3: tsconfig.json에 JSX 설정 추가**

`tsconfig.json`의 `compilerOptions`에 다음 두 줄을 추가한다:

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2021",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "ignoreDeprecations": "6.0",
    "incremental": true,
    "skipLibCheck": true,
    "strict": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "types": ["jest", "node"],
    "jsx": "react-jsx",
    "jsxImportSource": "react"
  }
}
```

- [ ] **Step 4: package.json에 db:push 스크립트 추가**

`package.json`의 `scripts`에 추가:

```json
"db:push": "drizzle-kit push"
```

- [ ] **Step 5: 커밋**

```bash
git add package.json tsconfig.json
git commit -m "chore: add react-email packages and jsx tsconfig options"
```

---

## Task 2: 환경변수 스키마 업데이트

**Files:**
- Modify: `src/bootstrap/validation/env.schema.ts`
- Modify: `.env.development`
- Modify: `.env.example` (있으면)

- [ ] **Step 1: env.schema.ts에 이메일 관련 변수 추가**

`src/bootstrap/validation/env.schema.ts` 전체 교체:

```typescript
import { z } from 'zod';

export const EnvSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.url().optional(),
  JWT_SECRET: z.string().min(32),
  ALLOWED_ORIGINS: z.string().default('http://localhost:3000'),
  API_BASE_URL: z.url().default('http://localhost:3000'),

  EMAIL_PROVIDER: z.enum(['resend', 'smtp', 'log']).default('log'),
  EMAIL_FROM: z.string().email().default('noreply@example.com'),

  RESEND_API_KEY: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_SECURE: z.string().transform(v => v === 'true').default('false'),
});

export type Env = z.infer<typeof EnvSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const result = EnvSchema.safeParse(config);
  if (!result.success) {
    const errors = result.error.issues
      .map((issue) => `  ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Environment validation failed:\n${errors}`);
  }
  return result.data;
}
```

- [ ] **Step 2: .env.development에 이메일 변수 추가**

`.env.development` 파일에 다음 추가:

```env
# Email
EMAIL_PROVIDER=log
EMAIL_FROM=noreply@example.com
API_BASE_URL=http://localhost:3000

# Resend (production용)
# RESEND_API_KEY=re_xxx

# SMTP (optional)
# SMTP_HOST=smtp.example.com
# SMTP_PORT=587
# SMTP_USER=user
# SMTP_PASS=pass
# SMTP_SECURE=false
```

- [ ] **Step 3: 기존 env.schema.spec.ts 테스트 실행 확인**

```bash
bun run test --testPathPattern=env.schema
```

Expected: PASS (기존 테스트가 새 필드에도 통과해야 함)

- [ ] **Step 4: 커밋**

```bash
git add src/bootstrap/validation/env.schema.ts .env.development
git commit -m "feat: add email environment variables to env schema"
```

---

## Task 3: DB 스키마 업데이트 및 마이그레이션

**Files:**
- Modify: `drizzle.config.ts`
- Modify: `src/modules/users/schemas/user.schema.ts`
- Modify: `package.json` (already done in Task 1)

- [ ] **Step 1: drizzle.config.ts 스키마 경로 수정**

`drizzle.config.ts` 전체 교체:

```typescript
import type { Config } from 'drizzle-kit';

const isProduction = process.env['NODE_ENV'] === 'production';

export default {
  dialect: isProduction ? 'postgresql' : 'sqlite',
  schema: './src/modules/**/schemas/*.schema.ts',
  out: './src/shared/infrastructure/database/migrations',
  dbCredentials: isProduction
    ? { url: process.env['DATABASE_URL'] as string }
    : { url: process.env['DATABASE_URL'] ?? 'file:./dev.db' },
} satisfies Config;
```

- [ ] **Step 2: user.schema.ts에 isEmailVerified, isMarketingSubscribed 추가**

`src/modules/users/schemas/user.schema.ts`의 `users` 테이블 정의에 두 컬럼 추가:

```typescript
import { pgTable, uuid, text, boolean, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'),
  isActive: boolean('is_active').notNull().default(true),
  isEmailVerified: boolean('is_email_verified').notNull().default(false),
  isMarketingSubscribed: boolean('is_marketing_subscribed').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const roles = pgTable('roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  description: text('description'),
});

export const userRoles = pgTable('user_roles', {
  userId: uuid('user_id').notNull().references(() => users.id),
  roleId: uuid('role_id').notNull().references(() => roles.id),
});

export const rolePermissions = pgTable('role_permissions', {
  roleId: uuid('role_id').notNull().references(() => roles.id),
  permission: text('permission').notNull(),
});

export const socialAccounts = pgTable('social_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  provider: text('provider').notNull(),
  providerId: text('provider_id').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type Role = typeof roles.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type NewRole = typeof roles.$inferInsert;
```

- [ ] **Step 3: SQLite 개발 환경에 스키마 적용**

```bash
NODE_ENV=development bun run db:push
```

Expected: 두 컬럼이 추가됨. `? Do you want to apply changes?` 프롬프트에 `yes`.

- [ ] **Step 4: 커밋**

```bash
git add drizzle.config.ts src/modules/users/schemas/user.schema.ts
git commit -m "feat: add isEmailVerified and isMarketingSubscribed columns to users"
```

---

## Task 4: IEmailProvider 인터페이스 + LogProvider

**Files:**
- Create: `src/shared/infrastructure/email/email.token.ts`
- Create: `src/shared/infrastructure/email/providers/email-provider.interface.ts`
- Create: `src/shared/infrastructure/email/providers/log.provider.ts`
- Create: `src/shared/infrastructure/email/providers/log.provider.spec.ts`

- [ ] **Step 1: email.token.ts 생성**

`src/shared/infrastructure/email/email.token.ts`:

```typescript
export const EMAIL_PROVIDER = 'EMAIL_PROVIDER_TOKEN';
```

- [ ] **Step 2: IEmailProvider 인터페이스 생성**

`src/shared/infrastructure/email/providers/email-provider.interface.ts`:

```typescript
export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export interface IEmailProvider {
  send(options: SendEmailOptions): Promise<void>;
}
```

- [ ] **Step 3: LogProvider 테스트 작성 (TDD)**

`src/shared/infrastructure/email/providers/log.provider.spec.ts`:

```typescript
import { LogProvider } from './log.provider';

describe('LogProvider', () => {
  let provider: LogProvider;

  beforeEach(() => {
    provider = new LogProvider();
  });

  it('logs email details to console without throwing', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await expect(provider.send({
      to: 'test@example.com',
      subject: 'Test Subject',
      html: '<p>Hello</p>',
    })).resolves.not.toThrow();

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('accepts array of recipients', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await expect(provider.send({
      to: ['a@example.com', 'b@example.com'],
      subject: 'Bulk',
      html: '<p>Hi</p>',
    })).resolves.not.toThrow();

    consoleSpy.mockRestore();
  });
});
```

- [ ] **Step 4: 테스트 실행 확인 (실패 확인)**

```bash
bun run test --testPathPattern=log.provider
```

Expected: FAIL with "Cannot find module './log.provider'"

- [ ] **Step 5: LogProvider 구현**

`src/shared/infrastructure/email/providers/log.provider.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import type { IEmailProvider, SendEmailOptions } from './email-provider.interface';

@Injectable()
export class LogProvider implements IEmailProvider {
  async send(options: SendEmailOptions): Promise<void> {
    console.log('[EmailService - LOG]', {
      to: options.to,
      subject: options.subject,
      html: options.html.substring(0, 200) + (options.html.length > 200 ? '...' : ''),
    });
  }
}
```

- [ ] **Step 6: 테스트 재실행 (통과 확인)**

```bash
bun run test --testPathPattern=log.provider
```

Expected: PASS

- [ ] **Step 7: 커밋**

```bash
git add src/shared/infrastructure/email/
git commit -m "feat: add IEmailProvider interface and LogProvider"
```

---

## Task 5: ResendProvider

**Files:**
- Create: `src/shared/infrastructure/email/providers/resend.provider.ts`
- Create: `src/shared/infrastructure/email/providers/resend.provider.spec.ts`

- [ ] **Step 1: ResendProvider 테스트 작성 (TDD)**

`src/shared/infrastructure/email/providers/resend.provider.spec.ts`:

```typescript
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ResendProvider } from './resend.provider';

const mockResendClient = {
  emails: {
    send: jest.fn(),
  },
};

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => mockResendClient),
}));

describe('ResendProvider', () => {
  let provider: ResendProvider;

  beforeEach(async () => {
    mockResendClient.emails.send.mockReset();

    const module = await Test.createTestingModule({
      providers: [
        ResendProvider,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn().mockImplementation((key: string) => {
              if (key === 'RESEND_API_KEY') return 're_test_key';
              if (key === 'EMAIL_FROM') return 'noreply@example.com';
              throw new Error(`Unknown key: ${key}`);
            }),
          },
        },
      ],
    }).compile();

    provider = module.get(ResendProvider);
  });

  it('sends email via Resend SDK', async () => {
    mockResendClient.emails.send.mockResolvedValue({ data: { id: 'msg-1' }, error: null });

    await provider.send({
      to: 'user@example.com',
      subject: 'Hello',
      html: '<p>Hi</p>',
    });

    expect(mockResendClient.emails.send).toHaveBeenCalledWith({
      from: 'noreply@example.com',
      to: 'user@example.com',
      subject: 'Hello',
      html: '<p>Hi</p>',
    });
  });

  it('throws EmailDeliveryException on Resend error', async () => {
    mockResendClient.emails.send.mockResolvedValue({
      data: null,
      error: { message: 'Invalid API key' },
    });

    await expect(provider.send({
      to: 'user@example.com',
      subject: 'Hello',
      html: '<p>Hi</p>',
    })).rejects.toThrow('Email delivery failed: Invalid API key');
  });
});
```

- [ ] **Step 2: 테스트 실행 (실패 확인)**

```bash
bun run test --testPathPattern=resend.provider
```

Expected: FAIL

- [ ] **Step 3: ResendProvider 구현**

`src/shared/infrastructure/email/providers/resend.provider.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import type { IEmailProvider, SendEmailOptions } from './email-provider.interface';

@Injectable()
export class ResendProvider implements IEmailProvider {
  private readonly client: Resend;
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    this.client = new Resend(config.getOrThrow<string>('RESEND_API_KEY'));
    this.from = config.getOrThrow<string>('EMAIL_FROM');
  }

  async send(options: SendEmailOptions): Promise<void> {
    const { data, error } = await this.client.emails.send({
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
```

- [ ] **Step 4: 테스트 재실행 (통과 확인)**

```bash
bun run test --testPathPattern=resend.provider
```

Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add src/shared/infrastructure/email/providers/resend.provider.ts src/shared/infrastructure/email/providers/resend.provider.spec.ts
git commit -m "feat: add ResendProvider"
```

---

## Task 6: SmtpProvider

**Files:**
- Create: `src/shared/infrastructure/email/providers/smtp.provider.ts`
- Create: `src/shared/infrastructure/email/providers/smtp.provider.spec.ts`

- [ ] **Step 1: SmtpProvider 테스트 작성 (TDD)**

`src/shared/infrastructure/email/providers/smtp.provider.spec.ts`:

```typescript
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SmtpProvider } from './smtp.provider';

const mockTransporter = {
  sendMail: jest.fn(),
};

jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue(mockTransporter),
}));

describe('SmtpProvider', () => {
  let provider: SmtpProvider;

  beforeEach(async () => {
    mockTransporter.sendMail.mockReset();

    const module = await Test.createTestingModule({
      providers: [
        SmtpProvider,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              const values: Record<string, unknown> = {
                SMTP_HOST: 'smtp.example.com',
                SMTP_PORT: 587,
                SMTP_USER: 'user',
                SMTP_PASS: 'pass',
                SMTP_SECURE: false,
                EMAIL_FROM: 'noreply@example.com',
              };
              return values[key];
            }),
          },
        },
      ],
    }).compile();

    provider = module.get(SmtpProvider);
  });

  it('sends email via nodemailer', async () => {
    mockTransporter.sendMail.mockResolvedValue({ messageId: 'msg-1' });

    await provider.send({
      to: 'user@example.com',
      subject: 'Test',
      html: '<p>Hi</p>',
    });

    expect(mockTransporter.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'noreply@example.com',
        to: 'user@example.com',
        subject: 'Test',
        html: '<p>Hi</p>',
      }),
    );
  });

  it('throws on smtp error', async () => {
    mockTransporter.sendMail.mockRejectedValue(new Error('Connection refused'));

    await expect(provider.send({
      to: 'user@example.com',
      subject: 'Test',
      html: '<p>Hi</p>',
    })).rejects.toThrow('Connection refused');
  });
});
```

- [ ] **Step 2: 테스트 실행 (실패 확인)**

```bash
bun run test --testPathPattern=smtp.provider
```

Expected: FAIL

- [ ] **Step 3: SmtpProvider 구현**

`src/shared/infrastructure/email/providers/smtp.provider.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { IEmailProvider, SendEmailOptions } from './email-provider.interface';

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
```

- [ ] **Step 4: 테스트 재실행 (통과 확인)**

```bash
bun run test --testPathPattern=smtp.provider
```

Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add src/shared/infrastructure/email/providers/smtp.provider.ts src/shared/infrastructure/email/providers/smtp.provider.spec.ts
git commit -m "feat: add SmtpProvider"
```

---

## Task 7: React Email 템플릿

**Files:**
- Create: `src/shared/infrastructure/email/templates/base.layout.tsx`
- Create: `src/shared/infrastructure/email/templates/signup-confirmation.email.tsx`
- Create: `src/shared/infrastructure/email/templates/password-reset.email.tsx`
- Create: `src/shared/infrastructure/email/templates/email-change.email.tsx`
- Create: `src/shared/infrastructure/email/templates/login-alert.email.tsx`
- Create: `src/shared/infrastructure/email/templates/subscription-confirm.email.tsx`
- Create: `src/shared/infrastructure/email/templates/welcome.email.tsx`
- Create: `src/shared/infrastructure/email/templates/account-deactivation.email.tsx`

- [ ] **Step 1: base.layout.tsx 생성**

`src/shared/infrastructure/email/templates/base.layout.tsx`:

```tsx
import { Body, Container, Head, Html } from '@react-email/components';

interface BaseLayoutProps {
  children: React.ReactNode;
}

const containerStyle = {
  maxWidth: '600px',
  margin: '0 auto',
  padding: '20px',
  fontFamily: 'Arial, sans-serif',
  color: '#333',
};

const bodyStyle = {
  backgroundColor: '#f6f9fc',
};

export function BaseLayout({ children }: BaseLayoutProps) {
  return (
    <Html lang="ko">
      <Head />
      <Body style={bodyStyle}>
        <Container style={containerStyle}>{children}</Container>
      </Body>
    </Html>
  );
}
```

- [ ] **Step 2: signup-confirmation.email.tsx 생성**

`src/shared/infrastructure/email/templates/signup-confirmation.email.tsx`:

```tsx
import { Button, Heading, Preview, Text } from '@react-email/components';
import { render } from '@react-email/render';
import { BaseLayout } from './base.layout';

interface Props {
  confirmUrl: string;
}

const buttonStyle = {
  backgroundColor: '#007bff',
  color: '#fff',
  padding: '12px 24px',
  borderRadius: '4px',
  textDecoration: 'none',
  display: 'inline-block',
};

export function SignupConfirmationEmail({ confirmUrl }: Props) {
  return (
    <BaseLayout>
      <Preview>이메일 주소를 확인해 주세요</Preview>
      <Heading>이메일 확인</Heading>
      <Text>회원가입을 완료하려면 아래 버튼을 클릭하세요.</Text>
      <Button href={confirmUrl} style={buttonStyle}>이메일 확인하기</Button>
      <Text style={{ color: '#999', fontSize: '12px' }}>
        이 링크는 24시간 동안 유효합니다. 본인이 요청하지 않은 경우 이 이메일을 무시하세요.
      </Text>
    </BaseLayout>
  );
}

export async function renderSignupConfirmation(confirmUrl: string): Promise<string> {
  return render(<SignupConfirmationEmail confirmUrl={confirmUrl} />);
}
```

- [ ] **Step 3: password-reset.email.tsx 생성**

`src/shared/infrastructure/email/templates/password-reset.email.tsx`:

```tsx
import { Button, Heading, Preview, Text } from '@react-email/components';
import { render } from '@react-email/render';
import { BaseLayout } from './base.layout';

interface Props {
  resetUrl: string;
}

const buttonStyle = {
  backgroundColor: '#dc3545',
  color: '#fff',
  padding: '12px 24px',
  borderRadius: '4px',
  textDecoration: 'none',
  display: 'inline-block',
};

export function PasswordResetEmail({ resetUrl }: Props) {
  return (
    <BaseLayout>
      <Preview>비밀번호 재설정 요청</Preview>
      <Heading>비밀번호 재설정</Heading>
      <Text>비밀번호 재설정을 요청하셨습니다. 아래 버튼을 클릭하세요.</Text>
      <Button href={resetUrl} style={buttonStyle}>비밀번호 재설정하기</Button>
      <Text style={{ color: '#999', fontSize: '12px' }}>
        이 링크는 1시간 동안 유효합니다. 본인이 요청하지 않은 경우 즉시 비밀번호를 변경하세요.
      </Text>
    </BaseLayout>
  );
}

export async function renderPasswordReset(resetUrl: string): Promise<string> {
  return render(<PasswordResetEmail resetUrl={resetUrl} />);
}
```

- [ ] **Step 4: email-change.email.tsx 생성**

`src/shared/infrastructure/email/templates/email-change.email.tsx`:

```tsx
import { Button, Heading, Preview, Text } from '@react-email/components';
import { render } from '@react-email/render';
import { BaseLayout } from './base.layout';

interface Props {
  confirmUrl: string;
  newEmail: string;
}

const buttonStyle = {
  backgroundColor: '#28a745',
  color: '#fff',
  padding: '12px 24px',
  borderRadius: '4px',
  textDecoration: 'none',
  display: 'inline-block',
};

export function EmailChangeEmail({ confirmUrl, newEmail }: Props) {
  return (
    <BaseLayout>
      <Preview>이메일 주소 변경 확인</Preview>
      <Heading>이메일 변경 확인</Heading>
      <Text>{newEmail}(으)로 이메일 주소 변경을 요청하셨습니다.</Text>
      <Button href={confirmUrl} style={buttonStyle}>변경 확인하기</Button>
      <Text style={{ color: '#999', fontSize: '12px' }}>
        이 링크는 24시간 동안 유효합니다. 본인이 요청하지 않은 경우 이 이메일을 무시하세요.
      </Text>
    </BaseLayout>
  );
}

export async function renderEmailChange(confirmUrl: string, newEmail: string): Promise<string> {
  return render(<EmailChangeEmail confirmUrl={confirmUrl} newEmail={newEmail} />);
}
```

- [ ] **Step 5: login-alert.email.tsx 생성**

`src/shared/infrastructure/email/templates/login-alert.email.tsx`:

```tsx
import { Heading, Preview, Text } from '@react-email/components';
import { render } from '@react-email/render';
import { BaseLayout } from './base.layout';

interface Props {
  ip: string;
  userAgent: string;
  loginTime: string;
}

export function LoginAlertEmail({ ip, userAgent, loginTime }: Props) {
  return (
    <BaseLayout>
      <Preview>새로운 로그인이 감지되었습니다</Preview>
      <Heading>로그인 알림</Heading>
      <Text>방금 귀하의 계정에 로그인되었습니다.</Text>
      <Text>
        <strong>시간:</strong> {loginTime}
        <br />
        <strong>IP:</strong> {ip}
        <br />
        <strong>브라우저:</strong> {userAgent}
      </Text>
      <Text style={{ color: '#999', fontSize: '12px' }}>
        본인이 아닌 경우 즉시 비밀번호를 변경하고 계정을 확인하세요.
      </Text>
    </BaseLayout>
  );
}

export async function renderLoginAlert(ip: string, userAgent: string): Promise<string> {
  const loginTime = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
  return render(<LoginAlertEmail ip={ip} userAgent={userAgent} loginTime={loginTime} />);
}
```

- [ ] **Step 6: subscription-confirm.email.tsx 생성**

`src/shared/infrastructure/email/templates/subscription-confirm.email.tsx`:

```tsx
import { Button, Heading, Preview, Text } from '@react-email/components';
import { render } from '@react-email/render';
import { BaseLayout } from './base.layout';

interface Props {
  confirmUrl: string;
}

const buttonStyle = {
  backgroundColor: '#6f42c1',
  color: '#fff',
  padding: '12px 24px',
  borderRadius: '4px',
  textDecoration: 'none',
  display: 'inline-block',
};

export function SubscriptionConfirmEmail({ confirmUrl }: Props) {
  return (
    <BaseLayout>
      <Preview>마케팅 수신 동의 확인</Preview>
      <Heading>마케팅 수신 동의</Heading>
      <Text>마케팅 이메일 수신을 신청해 주셨습니다. 아래 버튼으로 최종 확인해 주세요.</Text>
      <Button href={confirmUrl} style={buttonStyle}>수신 동의하기</Button>
      <Text style={{ color: '#999', fontSize: '12px' }}>
        이 링크는 48시간 동안 유효합니다. 본인이 요청하지 않은 경우 이 이메일을 무시하세요.
      </Text>
    </BaseLayout>
  );
}

export async function renderSubscriptionConfirm(confirmUrl: string): Promise<string> {
  return render(<SubscriptionConfirmEmail confirmUrl={confirmUrl} />);
}
```

- [ ] **Step 7: welcome.email.tsx 생성**

`src/shared/infrastructure/email/templates/welcome.email.tsx`:

```tsx
import { Heading, Preview, Text } from '@react-email/components';
import { render } from '@react-email/render';
import { BaseLayout } from './base.layout';

interface Props {
  name?: string;
}

export function WelcomeEmail({ name }: Props) {
  return (
    <BaseLayout>
      <Preview>환영합니다!</Preview>
      <Heading>환영합니다{name ? `, ${name}` : ''}!</Heading>
      <Text>가입을 환영합니다. 이제 서비스를 자유롭게 이용하세요.</Text>
    </BaseLayout>
  );
}

export async function renderWelcome(name?: string): Promise<string> {
  return render(<WelcomeEmail name={name} />);
}
```

- [ ] **Step 8: account-deactivation.email.tsx 생성**

`src/shared/infrastructure/email/templates/account-deactivation.email.tsx`:

```tsx
import { Heading, Preview, Text } from '@react-email/components';
import { render } from '@react-email/render';
import { BaseLayout } from './base.layout';

export function AccountDeactivationEmail() {
  return (
    <BaseLayout>
      <Preview>계정 비활성화 예정 안내</Preview>
      <Heading>계정 비활성화 예정</Heading>
      <Text>귀하의 계정이 곧 비활성화될 예정입니다. 계속 사용하시려면 로그인해 주세요.</Text>
      <Text style={{ color: '#999', fontSize: '12px' }}>
        문의사항이 있으시면 고객지원으로 연락해 주세요.
      </Text>
    </BaseLayout>
  );
}

export async function renderAccountDeactivation(): Promise<string> {
  return render(<AccountDeactivationEmail />);
}
```

- [ ] **Step 9: 커밋**

```bash
git add src/shared/infrastructure/email/templates/
git commit -m "feat: add React Email templates for 7 email types"
```

---

## Task 8: EmailService + EmailModule

**Files:**
- Create: `src/shared/infrastructure/email/email.service.ts`
- Create: `src/shared/infrastructure/email/email.service.spec.ts`
- Create: `src/shared/infrastructure/email/email.module.ts`
- Modify: `src/app.module.ts`

- [ ] **Step 1: EmailService 테스트 작성 (TDD)**

`src/shared/infrastructure/email/email.service.spec.ts`:

```typescript
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';
import { EMAIL_PROVIDER } from './email.token';
import type { IEmailProvider } from './providers/email-provider.interface';

describe('EmailService', () => {
  let service: EmailService;
  let mockProvider: jest.Mocked<IEmailProvider>;

  beforeEach(async () => {
    mockProvider = { send: jest.fn().mockResolvedValue(undefined) };

    const module = await Test.createTestingModule({
      providers: [
        EmailService,
        { provide: EMAIL_PROVIDER, useValue: mockProvider },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('http://localhost:3000'),
            getOrThrow: jest.fn().mockReturnValue('http://localhost:3000'),
          },
        },
      ],
    }).compile();

    service = module.get(EmailService);
  });

  describe('sendSignupConfirmation()', () => {
    it('calls provider.send with correct to and subject', async () => {
      await service.sendSignupConfirmation('user@example.com', 'token-abc');

      expect(mockProvider.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: expect.stringContaining('이메일'),
        }),
      );
    });
  });

  describe('sendPasswordReset()', () => {
    it('calls provider.send with reset subject', async () => {
      await service.sendPasswordReset('user@example.com', 'token-xyz');

      expect(mockProvider.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: expect.stringContaining('비밀번호'),
        }),
      );
    });
  });

  describe('sendLoginAlert()', () => {
    it('calls provider.send with login alert subject', async () => {
      await service.sendLoginAlert('user@example.com', '127.0.0.1', 'Mozilla/5.0');

      expect(mockProvider.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: expect.stringContaining('로그인'),
        }),
      );
    });
  });

  describe('sendWelcome()', () => {
    it('calls provider.send with welcome subject', async () => {
      await service.sendWelcome('user@example.com');

      expect(mockProvider.send).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'user@example.com' }),
      );
    });
  });

  describe('error handling', () => {
    it('does not throw when provider.send fails', async () => {
      mockProvider.send.mockRejectedValue(new Error('SMTP error'));

      await expect(service.sendWelcome('user@example.com')).resolves.not.toThrow();
    });
  });
});
```

- [ ] **Step 2: 테스트 실행 (실패 확인)**

```bash
bun run test --testPathPattern=email.service
```

Expected: FAIL

- [ ] **Step 3: EmailService 구현**

`src/shared/infrastructure/email/email.service.ts`:

```typescript
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
```

- [ ] **Step 4: 테스트 재실행 (통과 확인)**

```bash
bun run test --testPathPattern=email.service
```

Expected: PASS

- [ ] **Step 5: EmailModule 생성**

`src/shared/infrastructure/email/email.module.ts`:

```typescript
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
  ],
  exports: [EmailService],
})
export class EmailModule {}
```

- [ ] **Step 6: app.module.ts에 EmailModule 추가**

`src/app.module.ts`의 imports 배열에 `EmailModule`을 추가한다. `RedisModule` 뒤에 배치:

```typescript
import { EmailModule } from './shared/infrastructure/email/email.module';

// imports 배열에 추가:
EmailModule,
```

- [ ] **Step 7: 커밋**

```bash
git add src/shared/infrastructure/email/ src/app.module.ts
git commit -m "feat: add EmailService and EmailModule with provider factory"
```

---

## Task 9: UsersService 확장 (이메일 관련 메서드)

**Files:**
- Modify: `src/modules/users/users.service.ts`

- [ ] **Step 1: UsersService에 이메일 관련 메서드 추가**

`src/modules/users/users.service.ts`의 기존 메서드 아래에 다음을 추가한다:

```typescript
async setEmailVerified(id: string): Promise<void> {
  await this.db
    .update(schema.users)
    .set({ isEmailVerified: true, updatedAt: new Date() })
    .where(eq(schema.users.id, id));
}

async updatePassword(id: string, passwordHash: string): Promise<void> {
  await this.db
    .update(schema.users)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(schema.users.id, id));
}

async setMarketingSubscribed(id: string, value: boolean): Promise<void> {
  await this.db
    .update(schema.users)
    .set({ isMarketingSubscribed: value, updatedAt: new Date() })
    .where(eq(schema.users.id, id));
}
```

`users.service.ts`의 기존 import에 `eq`가 이미 있는지 확인. 없으면 `drizzle-orm`에서 추가.

- [ ] **Step 2: 커밋**

```bash
git add src/modules/users/users.service.ts
git commit -m "feat: add setEmailVerified, updatePassword, setMarketingSubscribed to UsersService"
```

---

## Task 10: Auth 토큰 플로우 — 비밀번호 재설정 + 이메일 확인

**Files:**
- Modify: `src/modules/auth/auth.service.ts`
- Modify: `src/modules/auth/auth.controller.ts`
- Modify: `src/modules/auth/auth.module.ts`
- Create: `src/modules/auth/dto/forgot-password.dto.ts`
- Create: `src/modules/auth/dto/reset-password.dto.ts`

- [ ] **Step 1: DTOs 생성**

`src/modules/auth/dto/forgot-password.dto.ts`:

```typescript
import { IsEmail } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail()
  email: string;
}
```

`src/modules/auth/dto/reset-password.dto.ts`:

```typescript
import { IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(8)
  newPassword: string;
}
```

- [ ] **Step 2: AuthService에 토큰 메서드 추가**

`src/modules/auth/auth.service.ts`에 다음 import 추가:

```typescript
import { randomBytes } from 'crypto';
import { EmailService } from '../../shared/infrastructure/email/email.service';
import { UsersService } from '../users/users.service';
```

생성자에 `EmailService` inject 추가:

```typescript
constructor(
  private readonly usersService: UsersService,
  private readonly jwtService: JwtService,
  private readonly config: ConfigService,
  @Inject(REDIS_CLIENT) private readonly redis: Redis,
  private readonly emailService: EmailService,
) {
  this.refreshTokenTtl = this.config.get<number>('JWT_REFRESH_TTL') ?? 604800;
}
```

`register()` 메서드 수정 — 회원가입 후 확인 이메일 + 환영 이메일 발송:

```typescript
async register(dto: RegisterDto) {
  const existing = await this.usersService.findByEmail(dto.email);
  if (existing) throw new ConflictException('Email already in use');
  const user = await this.usersService.create(dto);

  const verifyToken = randomBytes(32).toString('hex');
  await this.redis.setex(`email:verify:${verifyToken}`, 86400, user.id);

  void this.emailService.sendSignupConfirmation(user.email, verifyToken);
  void this.emailService.sendWelcome(user.email);

  return this.generateTokens(user.id, user.email);
}
```

`login()` 메서드 수정 — 로그인 알림 발송 (ip, userAgent는 컨트롤러에서 전달):

```typescript
async login(
  _dto: LoginDto,
  user: { userId: string; email: string },
  ip: string,
  userAgent: string,
) {
  void this.emailService.sendLoginAlert(user.email, ip, userAgent);
  return this.generateTokens(user.userId, user.email);
}
```

다음 메서드 추가:

```typescript
async forgotPassword(email: string): Promise<void> {
  const user = await this.usersService.findByEmail(email);
  if (!user) return; // 사용자 존재 여부 노출 방지

  const token = randomBytes(32).toString('hex');
  await this.redis.setex(`email:password-reset:${token}`, 3600, user.id);
  void this.emailService.sendPasswordReset(user.email, token);
}

async resetPassword(token: string, newPassword: string): Promise<void> {
  const userId = await this.redis.get(`email:password-reset:${token}`);
  if (!userId) throw new UnauthorizedException('Invalid or expired token');

  const passwordHash = await argon2.hash(newPassword);
  await this.usersService.updatePassword(userId, passwordHash);
  await this.redis.del(`email:password-reset:${token}`);
}

async verifyEmail(token: string): Promise<void> {
  const userId = await this.redis.get(`email:verify:${token}`);
  if (!userId) throw new UnauthorizedException('Invalid or expired token');

  await this.usersService.setEmailVerified(userId);
  await this.redis.del(`email:verify:${token}`);
}
```

`auth.service.ts` 상단 import에 `argon2` 추가 (없으면):

```typescript
import * as argon2 from 'argon2';
```

- [ ] **Step 3: AuthController에 엔드포인트 추가**

`src/modules/auth/auth.controller.ts` import에 추가:

```typescript
import { Query, Req } from '@nestjs/common';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import type { Request } from 'express';
```

`login()` 메서드 수정 — ip, userAgent 전달:

```typescript
@Post('login')
@UseGuards(LocalAuthGuard)
@HttpCode(HttpStatus.OK)
login(
  @Body() dto: LoginDto,
  @CurrentUser() user: { userId: string; email: string },
  @Req() req: Request,
) {
  const ip = req.ip ?? 'unknown';
  const userAgent = req.headers['user-agent'] ?? 'unknown';
  return this.authService.login(dto, user, ip, userAgent);
}
```

다음 엔드포인트 추가:

```typescript
@Post('forgot-password')
@HttpCode(HttpStatus.OK)
forgotPassword(@Body() dto: ForgotPasswordDto) {
  return this.authService.forgotPassword(dto.email);
}

@Post('reset-password')
@HttpCode(HttpStatus.OK)
resetPassword(@Body() dto: ResetPasswordDto) {
  return this.authService.resetPassword(dto.token, dto.newPassword);
}

@Get('verify-email')
@HttpCode(HttpStatus.OK)
verifyEmail(@Query('token') token: string) {
  return this.authService.verifyEmail(token);
}
```

- [ ] **Step 4: AuthModule에 EmailModule 추가**

`src/modules/auth/auth.module.ts`에서 `EmailModule`을 import 목록에 추가한다. `EmailModule`은 `@Global()`로 선언되어 있어 별도 import 없이도 주입 가능하지만, 명시적으로 추가하는 것을 권장한다:

```typescript
import { EmailModule } from '../../shared/infrastructure/email/email.module';

// imports 배열에 추가 (이미 Global이므로 선택적):
// EmailModule,  ← Global module이므로 app.module.ts 등록만으로 충분
```

`AuthService` providers 목록에 `EmailService`가 자동 주입되는지 확인. `EmailModule`이 `@Global()`이므로 별도 import 불필요.

- [ ] **Step 5: AuthService 테스트 전체 교체**

`src/modules/auth/auth.service.spec.ts`를 다음으로 교체한다 (`login()` 시그니처 변경 + EmailService mock 반영):

```typescript
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { REDIS_CLIENT } from '../../shared/infrastructure/redis/redis.provider';
import { EmailService } from '../../shared/infrastructure/email/email.service';

describe('AuthService', () => {
  let service: AuthService;
  let mockUsersService: {
    findByEmail: jest.Mock;
    create: jest.Mock;
    setEmailVerified: jest.Mock;
    updatePassword: jest.Mock;
  };
  let mockJwtService: { sign: jest.Mock; verify: jest.Mock };
  let mockRedis: { get: jest.Mock; setex: jest.Mock; del: jest.Mock; keys: jest.Mock };
  let mockEmailService: {
    sendSignupConfirmation: jest.Mock;
    sendWelcome: jest.Mock;
    sendLoginAlert: jest.Mock;
    sendPasswordReset: jest.Mock;
  };

  beforeEach(async () => {
    mockUsersService = {
      findByEmail: jest.fn(),
      create: jest.fn(),
      setEmailVerified: jest.fn().mockResolvedValue(undefined),
      updatePassword: jest.fn().mockResolvedValue(undefined),
    };
    mockJwtService = {
      sign: jest.fn().mockReturnValue('mock-token'),
      verify: jest.fn(),
    };
    mockRedis = {
      get: jest.fn().mockResolvedValue(null),
      setex: jest.fn().mockResolvedValue('OK'),
      del: jest.fn().mockResolvedValue(1),
      keys: jest.fn().mockResolvedValue([]),
    };
    mockEmailService = {
      sendSignupConfirmation: jest.fn().mockResolvedValue(undefined),
      sendWelcome: jest.fn().mockResolvedValue(undefined),
      sendLoginAlert: jest.fn().mockResolvedValue(undefined),
      sendPasswordReset: jest.fn().mockResolvedValue(undefined),
    };

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('1800'),
            getOrThrow: jest.fn().mockReturnValue('test-secret'),
          },
        },
        { provide: REDIS_CLIENT, useValue: mockRedis },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  describe('register()', () => {
    it('creates user and returns tokens', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue({ id: 'uuid', email: 'test@example.com' });

      const result = await service.register({ email: 'test@example.com', password: 'password123' });

      expect(result.accessToken).toBe('mock-token');
      expect(result.refreshToken).toBe('mock-token');
      expect(mockUsersService.create).toHaveBeenCalled();
    });

    it('throws ConflictException when email exists', async () => {
      mockUsersService.findByEmail.mockResolvedValue({ id: 'existing' });

      await expect(service.register({ email: 'test@example.com', password: 'password123' }))
        .rejects.toThrow('Email already in use');
    });
  });

  describe('login()', () => {
    it('returns tokens and sends login alert', async () => {
      const result = await service.login(
        { email: 'test@example.com', password: 'password123' },
        { userId: 'uuid', email: 'test@example.com' },
        '127.0.0.1',
        'Mozilla/5.0',
      );

      expect(result.accessToken).toBe('mock-token');
    });
  });

  describe('forgotPassword()', () => {
    it('silently returns for unknown email', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(service.forgotPassword('unknown@example.com')).resolves.not.toThrow();
      expect(mockEmailService.sendPasswordReset).not.toHaveBeenCalled();
    });

    it('sends reset email for known user', async () => {
      mockUsersService.findByEmail.mockResolvedValue({ id: 'uuid', email: 'test@example.com' });

      await service.forgotPassword('test@example.com');

      expect(mockRedis.setex).toHaveBeenCalledWith(
        expect.stringContaining('email:password-reset:'),
        3600,
        'uuid',
      );
    });
  });

  describe('resetPassword()', () => {
    it('throws UnauthorizedException for invalid token', async () => {
      mockRedis.get.mockResolvedValue(null);

      await expect(service.resetPassword('bad-token', 'newpass123'))
        .rejects.toThrow('Invalid or expired token');
    });

    it('updates password for valid token', async () => {
      mockRedis.get.mockResolvedValue('user-uuid');

      await service.resetPassword('valid-token', 'newpassword123');

      expect(mockUsersService.updatePassword).toHaveBeenCalledWith('user-uuid', expect.any(String));
      expect(mockRedis.del).toHaveBeenCalledWith('email:password-reset:valid-token');
    });
  });

  describe('verifyEmail()', () => {
    it('throws UnauthorizedException for invalid token', async () => {
      mockRedis.get.mockResolvedValue(null);

      await expect(service.verifyEmail('bad-token')).rejects.toThrow('Invalid or expired token');
    });

    it('sets email verified for valid token', async () => {
      mockRedis.get.mockResolvedValue('user-uuid');

      await service.verifyEmail('valid-token');

      expect(mockUsersService.setEmailVerified).toHaveBeenCalledWith('user-uuid');
      expect(mockRedis.del).toHaveBeenCalledWith('email:verify:valid-token');
    });
  });

  describe('refreshTokens()', () => {
    it('issues new tokens for valid refresh token', async () => {
      mockJwtService.verify.mockReturnValue({ sub: 'uuid', email: 'test@example.com' });
      mockRedis.get.mockResolvedValue('valid-refresh-token');

      const result = await service.refreshTokens('valid-refresh-token');

      expect(result.accessToken).toBe('mock-token');
      expect(result.refreshToken).toBe('mock-token');
    });
  });
});
```

- [ ] **Step 6: 테스트 실행**

```bash
bun run test --testPathPattern=auth.service
```

Expected: PASS

- [ ] **Step 7: 커밋**

```bash
git add src/modules/auth/
git commit -m "feat: add forgot-password, reset-password, verify-email flows to AuthService"
```

---

## Task 11: 마케팅 구독/해지 플로우

**Files:**
- Modify: `src/modules/auth/auth.service.ts`
- Modify: `src/modules/auth/auth.controller.ts`
- Create: `src/modules/auth/dto/subscribe.dto.ts`

- [ ] **Step 1: SubscribeDto 생성**

`src/modules/auth/dto/subscribe.dto.ts`:

```typescript
import { IsEmail } from 'class-validator';

export class SubscribeDto {
  @IsEmail()
  email: string;
}
```

- [ ] **Step 2: AuthService에 구독 메서드 추가**

`src/modules/auth/auth.service.ts`에 다음 메서드 추가:

```typescript
async subscribeMarketing(email: string): Promise<void> {
  const user = await this.usersService.findByEmail(email);
  if (!user) return; // 존재 여부 노출 방지

  const token = randomBytes(32).toString('hex');
  await this.redis.setex(`email:subscribe:${token}`, 172800, user.id); // 48시간
  void this.emailService.sendSubscriptionConfirmation(user.email, token);
}

async confirmSubscription(token: string): Promise<void> {
  const userId = await this.redis.get(`email:subscribe:${token}`);
  if (!userId) throw new UnauthorizedException('Invalid or expired token');

  await this.usersService.setMarketingSubscribed(userId, true);
  await this.redis.del(`email:subscribe:${token}`);
}

async unsubscribeMarketing(token: string): Promise<void> {
  const userId = await this.redis.get(`email:unsubscribe:${token}`);
  if (!userId) throw new UnauthorizedException('Invalid or expired token');

  await this.usersService.setMarketingSubscribed(userId, false);
  await this.redis.del(`email:unsubscribe:${token}`);
}

async generateUnsubscribeToken(userId: string): Promise<string> {
  const token = randomBytes(32).toString('hex');
  await this.redis.setex(`email:unsubscribe:${token}`, 604800, userId); // 7일
  return token;
}
```

- [ ] **Step 3: AuthController에 구독 엔드포인트 추가**

`src/modules/auth/auth.controller.ts` import에 추가:

```typescript
import { SubscribeDto } from './dto/subscribe.dto';
```

엔드포인트 추가:

```typescript
@Post('subscribe')
@HttpCode(HttpStatus.OK)
subscribe(@Body() dto: SubscribeDto) {
  return this.authService.subscribeMarketing(dto.email);
}

@Get('subscribe/confirm')
@HttpCode(HttpStatus.OK)
confirmSubscription(@Query('token') token: string) {
  return this.authService.confirmSubscription(token);
}

@Get('unsubscribe')
@HttpCode(HttpStatus.OK)
unsubscribe(@Query('token') token: string) {
  return this.authService.unsubscribeMarketing(token);
}
```

- [ ] **Step 4: 커밋**

```bash
git add src/modules/auth/
git commit -m "feat: add marketing subscribe/confirm/unsubscribe flows"
```

---

## Task 12: e2e 테스트

**Files:**
- Create: `test/auth-email.e2e-spec.ts`

- [ ] **Step 1: e2e 테스트 파일 생성**

`test/auth-email.e2e-spec.ts`:

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Auth Email Flows (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env['EMAIL_PROVIDER'] = 'log';

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/forgot-password', () => {
    it('returns 200 for unknown email (no user existence leak)', async () => {
      await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(200);
    });

    it('returns 200 for existing email', async () => {
      const email = `forgot-${Date.now()}@example.com`;
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email, password: 'password123' });

      await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email })
        .expect(200);
    });
  });

  describe('POST /auth/reset-password', () => {
    it('returns 401 for invalid token', async () => {
      await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({ token: 'invalid-token', newPassword: 'newpassword123' })
        .expect(401);
    });
  });

  describe('GET /auth/verify-email', () => {
    it('returns 401 for invalid token', async () => {
      await request(app.getHttpServer())
        .get('/auth/verify-email?token=invalid-token')
        .expect(401);
    });
  });

  describe('POST /auth/subscribe', () => {
    it('returns 200 for valid email', async () => {
      const email = `sub-${Date.now()}@example.com`;
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email, password: 'password123' });

      await request(app.getHttpServer())
        .post('/auth/subscribe')
        .send({ email })
        .expect(200);
    });
  });

  describe('GET /auth/unsubscribe', () => {
    it('returns 401 for invalid token', async () => {
      await request(app.getHttpServer())
        .get('/auth/unsubscribe?token=invalid-token')
        .expect(401);
    });
  });
});
```

- [ ] **Step 2: e2e 테스트 실행**

```bash
NODE_ENV=test EMAIL_PROVIDER=log bun run test:e2e -- --testPathPattern=auth-email
```

Expected: PASS

- [ ] **Step 3: 커밋**

```bash
git add test/auth-email.e2e-spec.ts
git commit -m "test: add e2e tests for email token flows"
```

---

## 수용 기준 체크리스트

- [ ] `EMAIL_PROVIDER=resend`로 Resend를 통한 실제 발송
- [ ] `EMAIL_PROVIDER=smtp`로 SMTP 발송
- [ ] `EMAIL_PROVIDER=log`로 콘솔 출력 (발송 없음)
- [ ] 7종 이메일 템플릿 모두 React Email TSX로 구현
- [ ] `POST /auth/forgot-password` → 1시간 유효 토큰 이메일 발송
- [ ] `POST /auth/reset-password` → 토큰 검증 후 비밀번호 변경, 토큰 삭제
- [ ] `GET /auth/verify-email?token=` → 24시간 유효 토큰 검증, isEmailVerified=true
- [ ] `POST /auth/subscribe` → 48시간 유효 마케팅 구독 확인 이메일
- [ ] `GET /auth/subscribe/confirm?token=` → isMarketingSubscribed=true
- [ ] `GET /auth/unsubscribe?token=` → isMarketingSubscribed=false
- [ ] 이메일 발송 실패 시 메인 플로우 차단 없음 (로그만 남김)
- [ ] 회원가입 시 이메일 확인 + 환영 이메일 자동 발송
- [ ] 로그인 시 로그인 알림 이메일 자동 발송
- [ ] 모든 단위 테스트 통과
- [ ] e2e 토큰 플로우 테스트 통과
- [ ] Biome lint/format 통과
