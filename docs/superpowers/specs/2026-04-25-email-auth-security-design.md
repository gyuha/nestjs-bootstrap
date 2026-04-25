# Email Auth & Security Enhancement Design

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add email verification, password complexity validation, account lockout, password reset, and magic link authentication to the existing NestJS bootstrap project.

**Architecture:** Extend the existing auth module with new domain services, infrastructure implementations, and presentation layer endpoints. Email sending abstracted via interface with console (dev) and SMTP (prod) implementations.

**Tech Stack:** NestJS 11, Drizzle ORM, PostgreSQL, Redis, Nodemailer, class-validator

---

## 1. Database Schema Changes

### 1.1 Users Table Updates

File: `src/infrastructure/database/schema/users.schema.ts`

```typescript
import { pgTable, uuid, varchar, timestamp, pgEnum, boolean, text } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }),
  name: varchar('name', { length: 100 }).notNull(),
  role: roleEnum('role').notNull().default('USER'),
  status: statusEnum('status').notNull().default('ACTIVE'),
  emailVerified: boolean('email_verified').notNull().default(false),
  lockoutUntil: timestamp('lockout_until'),
  failedLoginAttempts: integer('failed_login_attempts').notNull().default(0),
  verificationToken: varchar('verification_token', { length: 255 }),
  verificationTokenExpiry: timestamp('verification_token_expiry'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
```

### 1.2 Password Reset Tokens Table

File: `src/infrastructure/database/schema/password-reset.schema.ts` (create new)

```typescript
import { pgTable, uuid, varchar, timestamp, text } from 'drizzle-orm/pg-core';

export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  tokenHash: varchar('token_hash', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
```

### 1.3 Magic Links Table

File: `src/infrastructure/database/schema/magic-links.schema.ts` (create new)

```typescript
import { pgTable, uuid, varchar, timestamp, text } from 'drizzle-orm/pg-core';

export const magicLinks = pgTable('magic_links', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull(),
  tokenHash: varchar('token_hash', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
```

---

## 2. Email Service

### 2.1 Interface

File: `src/shared/infrastructure/email/email-service.interface.ts`

```typescript
export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailServiceInterface {
  send(options: EmailOptions): Promise<void>;
}
```

### 2.2 Console Email Service (Development)

File: `src/shared/infrastructure/email/console-email.service.ts`

- Implements `EmailServiceInterface`
- Logs email content to console with prefix `[EMAIL]`
- Does NOT actually send emails

### 2.3 SMTP Email Service (Production)

File: `src/shared/infrastructure/email/smtp-email.service.ts`

- Implements `EmailServiceInterface`
- Uses Nodemailer with SMTP transport
- Configuration via env vars: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`

### 2.4 Email Module

File: `src/shared/infrastructure/email/email.module.ts`

- Provides `EmailServiceInterface` based on `EMAIL_PROVIDER` env
- `console` → ConsoleEmailService
- `smtp` → SmtpEmailService

---

## 3. Email Templates

File: `src/shared/infrastructure/email/templates/`

### 3.1 Email Verification

Subject: `[NestJS Bootstrap] Please verify your email`

```html
<h1>Verify Your Email</h1>
<p>Click the link below to verify your email address:</p>
<a href="{{verificationUrl}}">Verify Email</a>
<p>This link expires in 24 hours.</p>
```

### 3.2 Password Reset

Subject: `[NestJS Bootstrap] Reset Your Password`

```html
<h1>Reset Your Password</h1>
<p>Click the link below to reset your password:</p>
<a href="{{resetUrl}}">Reset Password</a>
<p>This link expires in 15 minutes.</p>
```

### 3.3 Magic Link

Subject: `[NestJS Bootstrap] Your Magic Link`

```html
<h1>Sign In to NestJS Bootstrap</h1>
<p>Click the link below to sign in:</p>
<a href="{{magicLinkUrl}}">Sign In</a>
<p>This link expires in 15 minutes.</p>
```

---

## 4. Password Validation

File: `src/shared/utils/password.validation.ts`

```typescript
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  if (password.length < PASSWORD_MIN_LENGTH) {
    errors.push(`Password must be at least ${PASSWORD_MIN_LENGTH} characters`);
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (!/[@$!%*?&]/.test(password)) {
    errors.push('Password must contain at least one special character (@$!%*?&)');
  }

  return { isValid: errors.length === 0, errors };
}
```

---

## 5. Auth Application Service Changes

File: `src/modules/auth/application/auth-application.service.ts`

### 5.1 New Methods

```typescript
// Send verification email
async sendVerificationEmail(email: string): Promise<void>

// Verify email with token
async verifyEmail(token: string): Promise<void>

// Request password reset
async forgotPassword(email: string): Promise<void>

// Reset password with token
async resetPassword(token: string, newPassword: string): Promise<void>

// Request magic link
async requestMagicLink(email: string): Promise<void>

// Login with magic link
async loginWithMagicLink(token: string): Promise<AuthResult>
```

### 5.2 Modified Login Flow

```typescript
async loginWithPassword(email: string, password: string): Promise<AuthResult> {
  // 1. Check account lockout
  if (user.lockoutUntil && user.lockoutUntil > new Date()) {
    throw AuthException.accountLocked();
  }

  // 2. Validate password
  const isValid = await bcrypt.compare(password, user.passwordHash!);
  if (!isValid) {
    // Increment failed login attempts
    await this.incrementFailedLoginAttempts(user.id);
    // Check if should lock
    if (user.failedLoginAttempts >= 9) { // 10th failure triggers lock
      await this.lockAccount(user.id);
      throw AuthException.accountLocked();
    }
    throw AuthException.invalidCredentials();
  }

  // 3. Reset failed attempts on success
  await this.resetFailedLoginAttempts(user.id);

  // 4. Generate auth result
  return this.generateAuthResult(user.id, user.email, user.name, user.role);
}
```

### 5.3 New Helper Methods

```typescript
private async incrementFailedLoginAttempts(userId: string): Promise<void>
private async lockAccount(userId: string): Promise<void> // Sets lockoutUntil = now + 5 min
private async resetFailedLoginAttempts(userId: string): Promise<void>
private generateVerificationToken(): string
private generateMagicToken(): string
private async sendEmail(options: EmailOptions): Promise<void>
```

---

## 6. Auth Controller New Endpoints

File: `src/modules/auth/presentation/auth.controller.ts`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/register` | Register new user (sends verification email) | Public |
| POST | `/auth/resend-verification` | Resend verification email | Public |
| GET | `/auth/verify-email/:token` | Verify email with token | Public |
| POST | `/auth/forgot-password` | Request password reset | Public |
| POST | `/auth/reset-password` | Reset password with token | Public |
| POST | `/auth/magic-link` | Request magic link | Public |
| GET | `/auth/magic-link/:token` | Login with magic link | Public |

### 6.1 DTOs

File: `src/modules/auth/application/dto/auth.dto.ts`

```typescript
export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  password: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class ResendVerificationDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  token: string;

  @ApiProperty()
  @IsString()
  newPassword: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;
}

export class MagicLinkRequestDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;
}
```

---

## 7. Exception Updates

File: `src/modules/auth/presentation/exceptions/auth.exception.ts`

```typescript
// Add to AuthException class:
static emailNotVerified(): HttpException { ... }
static accountLocked(): HttpException { ... }
static invalidResetToken(): HttpException { ... }
static resetTokenExpired(): HttpException { ... }
static invalidMagicLink(): HttpException { ... }
static magicLinkExpired(): HttpException { ... }
```

---

## 8. Environment Variables

File: `src/config/env.schema.ts`

Add:

```typescript
EMAIL_PROVIDER: z.enum(['console', 'smtp']).default('console'),
SMTP_HOST: z.string().optional(),
SMTP_PORT: z.string().optional(),
SMTP_USER: z.string().optional(),
SMTP_PASS: z.string().optional(),
EMAIL_FROM: z.string().default('noreply@nestjs-bootstrap.com'),
```

---

## 9. Module Structure After Changes

```
src/
├── modules/auth/
│   ├── domain/
│   │   ├── entities/auth.entity.ts
│   │   ├── value-objects/token.value-object.ts
│   │   ├── repositories/auth-token.repository.interface.ts
│   │   └── services/token.service.interface.ts
│   ├── application/
│   │   ├── services/auth-application.service.ts  (enhanced)
│   │   └── dto/auth.dto.ts  (new DTOs added)
│   ├── infrastructure/
│   │   ├── auth.module.ts
│   │   ├── services/jwt-token.service.ts
│   │   ├── services/oauth-google.service.ts
│   │   ├── services/oauth-kakao.service.ts
│   │   └── repositories/redis-postgres-token.repository.ts
│   └── presentation/
│       ├── auth.controller.ts  (new endpoints)
│       ├── guards/jwt-auth.guard.ts
│       ├── guards/roles.guard.ts
│       ├── decorators/public.decorator.ts
│       └── exceptions/auth.exception.ts  (new exceptions)
├── shared/
│   └── infrastructure/
│       └── email/
│           ├── email.module.ts
│           ├── email-service.interface.ts
│           ├── console-email.service.ts
│           ├── smtp-email.service.ts
│           └── templates/  (email templates)
│   └── utils/
│       └── password.validation.ts
└── infrastructure/
    └── database/
        └── schema/
            ├── users.schema.ts  (updated)
            ├── password-reset.schema.ts  (new)
            └── magic-links.schema.ts  (new)
```

---

## 10. Implementation Order

### Phase 1: Security Basics
1. Password validation utility
2. Account lockout fields in users schema
3. Update login logic for lockout
4. Drizzle migration

### Phase 2: Email Infrastructure
5. Email service interface
6. Console email service (dev)
7. SMTP email service (prod)
8. Email module

### Phase 3: Email Features
9. Email verification on registration
10. Resend verification endpoint
11. Verify email endpoint

### Phase 4: Password Reset
12. Password reset tokens table
13. Forgot password endpoint
14. Reset password endpoint

### Phase 5: Magic Links
15. Magic links table
16. Request magic link endpoint
17. Magic link login endpoint

---

## 11. Testing Strategy

- Unit tests for password validation utility
- Unit tests for email token generation
- Unit tests for account lockout logic
- Integration tests for email sending (mock)
- E2E tests for full auth flows
