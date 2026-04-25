# Email Auth & Security Enhancement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement email verification, password complexity validation, account lockout, password reset, and magic link authentication.

**Architecture:** Extend auth module with new domain services, infrastructure implementations, and presentation endpoints. Email abstracted via interface with console (dev) and SMTP (prod) implementations.

**Tech Stack:** NestJS 11, Drizzle ORM, PostgreSQL, Redis, Nodemailer, class-validator, bcrypt

---

## Task 1: Password Validation Utility

**Files:**
- Create: `src/shared/utils/password.validation.ts`
- Test: `src/test/utils/password.validation.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/test/utils/password.validation.test.ts
import { validatePassword } from '../../shared/utils/password.validation';

describe('validatePassword', () => {
  it('should reject password shorter than 8 characters', () => {
    const result = validatePassword('Abc1!');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Password must be at least 8 characters');
  });

  it('should reject password without lowercase letter', () => {
    const result = validatePassword('ABCDEFG1!');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one lowercase letter');
  });

  it('should reject password without uppercase letter', () => {
    const result = validatePassword('abcdefg1!');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one uppercase letter');
  });

  it('should reject password without number', () => {
    const result = validatePassword('Abcdefgh!');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one number');
  });

  it('should reject password without special character', () => {
    const result = validatePassword('Abcdefgh1');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one special character (@$!%*?&)');
  });

  it('should accept valid password meeting all criteria', () => {
    const result = validatePassword('Abcdefgh1!');
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- src/test/utils/password.validation.test.ts`
Expected: FAIL with "Cannot find module"

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/shared/utils/password.validation.ts

const PASSWORD_MIN_LENGTH = 8;

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

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- src/test/utils/password.validation.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/shared/utils/password.validation.ts src/test/utils/password.validation.test.ts
git commit -m "feat(auth): add password complexity validation utility

- Minimum 8 characters
- Requires uppercase, lowercase, number, special character
- Returns validation result with error messages

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 2: Update Users Schema with Lockout Fields

**Files:**
- Modify: `src/infrastructure/database/schema/users.schema.ts`
- Modify: `src/infrastructure/database/schema/index.ts`

- [ ] **Step 1: Read current schema**

```typescript
// Current users.schema.ts (already verified)
import { pgTable, uuid, varchar, timestamp, pgEnum } from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role', ['USER', 'ADMIN']);
export const statusEnum = pgEnum('status', ['ACTIVE', 'INACTIVE']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }),
  name: varchar('name', { length: 100 }).notNull(),
  role: roleEnum('role').notNull().default('USER'),
  status: statusEnum('status').notNull().default('ACTIVE'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
```

- [ ] **Step 2: Update users schema with new fields**

```typescript
// src/infrastructure/database/schema/users.schema.ts
import { pgTable, uuid, varchar, timestamp, pgEnum, boolean, integer } from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role', ['USER', 'ADMIN']);
export const statusEnum = pgEnum('status', ['ACTIVE', 'INACTIVE']);

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

- [ ] **Step 3: Commit**

```bash
git add src/infrastructure/database/schema/users.schema.ts
git commit -m "feat(auth): add lockout and email verification fields to users schema

- emailVerified: boolean (default false)
- lockoutUntil: timestamp (nullable)
- failedLoginAttempts: integer (default 0)
- verificationToken: varchar (nullable)
- verificationTokenExpiry: timestamp (nullable)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 3: Add New Auth Exceptions

**Files:**
- Modify: `src/modules/auth/presentation/exceptions/auth.exception.ts`

- [ ] **Step 1: Read current exceptions**

Current content:
```typescript
import { HttpException, HttpStatus } from '@nestjs/common';

export class AuthException extends HttpException {
  static invalidCredentials() { ... }
  static invalidRefreshToken() { ... }
  static accountInactive() { ... }
  static unauthorized() { ... }
  static forbidden() { ... }
}
```

- [ ] **Step 2: Add new exception methods**

```typescript
// src/modules/auth/presentation/exceptions/auth.exception.ts
import { HttpException, HttpStatus } from '@nestjs/common';

export class AuthException extends HttpException {
  static invalidCredentials() {
    return new HttpException(
      { code: 'AUTH_INVALID_CREDENTIALS', message: 'Invalid email or password' },
      HttpStatus.UNAUTHORIZED,
    );
  }

  static invalidRefreshToken() {
    return new HttpException(
      { code: 'AUTH_INVALID_REFRESH_TOKEN', message: 'Invalid or expired refresh token' },
      HttpStatus.UNAUTHORIZED,
    );
  }

  static accountInactive() {
    return new HttpException(
      { code: 'AUTH_ACCOUNT_INACTIVE', message: 'Account is inactive' },
      HttpStatus.FORBIDDEN,
    );
  }

  static unauthorized() {
    return new HttpException(
      { code: 'AUTH_UNAUTHORIZED', message: 'Unauthorized' },
      HttpStatus.UNAUTHORIZED,
    );
  }

  static forbidden() {
    return new HttpException(
      { code: 'AUTH_FORBIDDEN', message: 'Forbidden' },
      HttpStatus.FORBIDDEN,
    );
  }

  static accountLocked() {
    return new HttpException(
      { code: 'AUTH_ACCOUNT_LOCKED', message: 'Account is temporarily locked due to too many failed login attempts' },
      HttpStatus.LOCKED,
    );
  }

  static emailNotVerified() {
    return new HttpException(
      { code: 'AUTH_EMAIL_NOT_VERIFIED', message: 'Please verify your email address' },
      HttpStatus.FORBIDDEN,
    );
  }

  static invalidResetToken() {
    return new HttpException(
      { code: 'AUTH_INVALID_RESET_TOKEN', message: 'Invalid password reset token' },
      HttpStatus.BAD_REQUEST,
    );
  }

  static resetTokenExpired() {
    return new HttpException(
      { code: 'AUTH_RESET_TOKEN_EXPIRED', message: 'Password reset token has expired' },
      HttpStatus.BAD_REQUEST,
    );
  }

  static invalidMagicLink() {
    return new HttpException(
      { code: 'AUTH_INVALID_MAGIC_LINK', message: 'Invalid or expired magic link' },
      HttpStatus.BAD_REQUEST,
    );
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/modules/auth/presentation/exceptions/auth.exception.ts
git commit -m "feat(auth): add account lockout and token exception methods

- accountLocked(): 423 Locked status
- emailNotVerified(): 403 Forbidden
- invalidResetToken(): 400 Bad Request
- resetTokenExpired(): 400 Bad Request
- invalidMagicLink(): 400 Bad Request

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 4: Create Email Service Interface and Implementation

**Files:**
- Create: `src/shared/infrastructure/email/email-service.interface.ts`
- Create: `src/shared/infrastructure/email/console-email.service.ts`
- Create: `src/shared/infrastructure/email/smtp-email.service.ts`
- Create: `src/shared/infrastructure/email/email.module.ts`
- Create: `src/shared/infrastructure/email/templates/verification-email.ts`
- Create: `src/shared/infrastructure/email/templates/password-reset-email.ts`
- Create: `src/shared/infrastructure/email/templates/magic-link-email.ts`

- [ ] **Step 1: Create email service interface**

```typescript
// src/shared/infrastructure/email/email-service.interface.ts

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

- [ ] **Step 2: Create console email service (dev)**

```typescript
// src/shared/infrastructure/email/console-email.service.ts
import { Injectable } from '@nestjs/common';
import { EmailServiceInterface, EmailOptions } from './email-service.interface';

@Injectable()
export class ConsoleEmailService implements EmailServiceInterface {
  async send(options: EmailOptions): Promise<void> {
    console.log('[EMAIL] ====================================');
    console.log('[EMAIL] To:', options.to);
    console.log('[EMAIL] Subject:', options.subject);
    console.log('[EMAIL] ===================================');
    console.log(options.html);
    console.log('[EMAIL] ===================================');
  }
}
```

- [ ] **Step 3: Create SMTP email service (prod)**

```typescript
// src/shared/infrastructure/email/smtp-email.service.ts
import { Injectable } from '@nestjs/common';
import { EmailServiceInterface, EmailOptions } from './email-service.interface';
import * as nodemailer from 'nodemailer';
import { EnvService } from '../../../config/env.service';

@Injectable()
export class SmtpEmailService implements EmailServiceInterface {
  private transporter: nodemailer.Transporter;

  constructor(private readonly env: EnvService) {
    this.transporter = nodemailer.createTransport({
      host: this.env.get('SMTP_HOST'),
      port: parseInt(this.env.get('SMTP_PORT') || '587'),
      secure: false,
      auth: {
        user: this.env.get('SMTP_USER'),
        pass: this.env.get('SMTP_PASS'),
      },
    });
  }

  async send(options: EmailOptions): Promise<void> {
    await this.transporter.sendMail({
      from: this.env.get('EMAIL_FROM'),
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
  }
}
```

- [ ] **Step 4: Create email templates**

```typescript
// src/shared/infrastructure/email/templates/verification-email.ts

export function getVerificationEmailHtml(verificationUrl: string): string {
  return `
    <h1>Verify Your Email</h1>
    <p>Click the link below to verify your email address:</p>
    <a href="${verificationUrl}">Verify Email</a>
    <p>This link expires in 24 hours.</p>
  `;
}

export function getVerificationEmailSubject(): string {
  return '[NestJS Bootstrap] Please verify your email';
}
```

```typescript
// src/shared/infrastructure/email/templates/password-reset-email.ts

export function getPasswordResetEmailHtml(resetUrl: string): string {
  return `
    <h1>Reset Your Password</h1>
    <p>Click the link below to reset your password:</p>
    <a href="${resetUrl}">Reset Password</a>
    <p>This link expires in 15 minutes.</p>
  `;
}

export function getPasswordResetEmailSubject(): string {
  return '[NestJS Bootstrap] Reset Your Password';
}
```

```typescript
// src/shared/infrastructure/email/templates/magic-link-email.ts

export function getMagicLinkEmailHtml(magicLinkUrl: string): string {
  return `
    <h1>Sign In to NestJS Bootstrap</h1>
    <p>Click the link below to sign in:</p>
    <a href="${magicLinkUrl}">Sign In</a>
    <p>This link expires in 15 minutes.</p>
  `;
}

export function getMagicLinkEmailSubject(): string {
  return '[NestJS Bootstrap] Your Magic Link';
}
```

- [ ] **Step 5: Create email module**

```typescript
// src/shared/infrastructure/email/email.module.ts
import { Module, Global } from '@nestjs/common';
import { EmailServiceInterface } from './email-service.interface';
import { ConsoleEmailService } from './console-email.service';
import { SmtpEmailService } from './smtp-email.service';
import { EnvService } from '../../../config/env.service';

@Global()
@Module({
  providers: [
    {
      provide: EmailServiceInterface,
      useFactory: (env: EnvService) => {
        const provider = env.get('EMAIL_PROVIDER');
        if (provider === 'smtp') {
          return new SmtpEmailService(env);
        }
        return new ConsoleEmailService();
      },
      inject: [EnvService],
    },
  ],
  exports: [EmailServiceInterface],
})
export class EmailModule {}
```

- [ ] **Step 6: Update env.schema.ts**

```typescript
// src/config/env.schema.ts (add new fields)
import { z } from 'zod';

export const envSchema = z.object({
  // ... existing fields ...
  EMAIL_PROVIDER: z.enum(['console', 'smtp']).default('console'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().default('noreply@nestjs-bootstrap.com'),
});

export type EnvConfig = z.infer<typeof envSchema>;
```

- [ ] **Step 7: Commit**

```bash
git add src/shared/infrastructure/email/
git add src/config/env.schema.ts
git commit -m "feat(email): add email infrastructure with console and SMTP providers

- EmailServiceInterface for abstracted email sending
- ConsoleEmailService for development (logs to console)
- SmtpEmailService for production (Nodemailer)
- Email templates for verification, password reset, magic link
- EMAIL_PROVIDER env var to switch implementations

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 5: Create Password Reset Tokens Schema

**Files:**
- Create: `src/infrastructure/database/schema/password-reset.schema.ts`
- Modify: `src/infrastructure/database/schema/index.ts`

- [ ] **Step 1: Create password reset schema**

```typescript
// src/infrastructure/database/schema/password-reset.schema.ts
import { pgTable, uuid, varchar, timestamp, text } from 'drizzle-orm/pg-core';
import { users } from './users.schema';

export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: varchar('token_hash', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
```

- [ ] **Step 2: Export from index.ts**

```typescript
// src/infrastructure/database/schema/index.ts
export { users } from './users.schema';
export { passwordResetTokens } from './password-reset.schema';
// ... existing exports ...
```

- [ ] **Step 3: Commit**

```bash
git add src/infrastructure/database/schema/password-reset.schema.ts src/infrastructure/database/schema/index.ts
git commit -m "feat(auth): add password reset tokens schema

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 6: Create Magic Links Schema

**Files:**
- Create: `src/infrastructure/database/schema/magic-links.schema.ts`
- Modify: `src/infrastructure/database/schema/index.ts`

- [ ] **Step 1: Create magic links schema**

```typescript
// src/infrastructure/database/schema/magic-links.schema.ts
import { pgTable, uuid, varchar, timestamp, text } from 'drizzle-orm/pg-core';

export const magicLinks = pgTable('magic_links', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull(),
  tokenHash: varchar('token_hash', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
```

- [ ] **Step 2: Export from index.ts**

```typescript
// src/infrastructure/database/schema/index.ts
export { users } from './users.schema';
export { passwordResetTokens } from './password-reset.schema';
export { magicLinks } from './magic-links.schema';
// ... existing exports ...
```

- [ ] **Step 3: Commit**

```bash
git add src/infrastructure/database/schema/magic-links.schema.ts src/infrastructure/database/schema/index.ts
git commit -m "feat(auth): add magic links schema

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 7: Update Auth Application Service with Lockout Logic

**Files:**
- Modify: `src/modules/auth/application/auth-application.service.ts`

- [ ] **Step 1: Read current auth-application.service.ts**

Review current implementation at `src/modules/auth/application/auth-application.service.ts`

- [ ] **Step 2: Add new imports and constants**

```typescript
import { Injectable, Inject } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import type { AuthResult } from '../domain/entities/auth.entity';
import type { TokenPair } from '../domain/value-objects/token.value-object';
import { OAuthProvider } from '../domain/value-objects/oauth-provider.value-object';
import type { UserRepository } from '../../users/domain/repository/user.repository.interface';
import type { JwtTokenService } from '../infrastructure/services/jwt-token.service';
import type { AuthTokenRepositoryInterface } from '../domain/repositories/auth-token.repository.interface';
import type { OAuthGoogleService } from '../infrastructure/services/oauth-google.service';
import type { OAuthKakaoService } from '../infrastructure/services/oauth-kakao.service';
import type { DrizzleService } from '../../../infrastructure/database/drizzle.service';
import { users } from '../../../infrastructure/database/schema/users.schema';
import { oauthAccounts } from '../../../infrastructure/database/schema/oauth-accounts.schema';
import { passwordResetTokens } from '../../../infrastructure/database/schema/password-reset.schema';
import { magicLinks } from '../../../infrastructure/database/schema/magic-links.schema';
import { AuthException } from '../presentation/exceptions/auth.exception';
import { Role, UserStatus } from '../../users/domain/value-objects/role.value-object';
import type { EnvService } from '../../../config/env.service';
import { validatePassword } from '../../../shared/utils/password.validation';
import type { EmailServiceInterface } from '../../../shared/infrastructure/email/email-service.interface';
import {
  getVerificationEmailHtml,
  getVerificationEmailSubject,
} from '../../../shared/infrastructure/email/templates/verification-email';
import {
  getPasswordResetEmailHtml,
  getPasswordResetEmailSubject,
} from '../../../shared/infrastructure/email/templates/password-reset-email';
import {
  getMagicLinkEmailHtml,
  getMagicLinkEmailSubject,
} from '../../../shared/infrastructure/email/templates/magic-link-email';
import { createHash, randomBytes } from 'crypto';
import { eq } from 'drizzle-orm';

const AUTH_TOKEN_REPOSITORY = 'AUTH_TOKEN_REPOSITORY';
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes
const MAX_LOGIN_ATTEMPTS = 10;
const VERIFICATION_TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
const RESET_TOKEN_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes
const MAGIC_LINK_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes
```

- [ ] **Step 3: Update constructor to inject EmailService**

```typescript
@Injectable()
export class AuthApplicationService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly jwtTokenService: JwtTokenService,
    @Inject(AUTH_TOKEN_REPOSITORY) private readonly tokenRepo: AuthTokenRepositoryInterface,
    private readonly oauthGoogle: OAuthGoogleService,
    private readonly oauthKakao: OAuthKakaoService,
    private readonly db: DrizzleService,
    private readonly env: EnvService,
    private readonly emailService: EmailServiceInterface,
  ) {}
```

- [ ] **Step 4: Replace loginWithPassword method**

```typescript
async loginWithPassword(email: string, password: string): Promise<AuthResult> {
  const user = await this.userRepo.findByEmail(email);
  if (!user) throw AuthException.invalidCredentials();

  // Check account lockout
  if (user.lockoutUntil && new Date(user.lockoutUntil) > new Date()) {
    throw AuthException.accountLocked();
  }

  const isValid = await bcrypt.compare(password, user.passwordHash!);
  if (!isValid) {
    // Increment failed login attempts
    await this.incrementFailedLoginAttempts(user.id);
    // Reload user to get updated count
    const updatedUser = await this.userRepo.findByEmail(email);
    // Check if should lock
    if (updatedUser && updatedUser.failedLoginAttempts >= MAX_LOGIN_ATTEMPTS - 1) {
      await this.lockAccount(user.id);
      throw AuthException.accountLocked();
    }
    throw AuthException.invalidCredentials();
  }

  // Reset failed attempts on success
  await this.resetFailedLoginAttempts(user.id);

  return this.generateAuthResult(user.id, user.email, user.name, user.role);
}
```

- [ ] **Step 5: Add helper methods**

```typescript
private async incrementFailedLoginAttempts(userId: string): Promise<void> {
  await this.db.db
    .update(users)
    .set({ failedLoginAttempts: users.failedLoginAttempts + 1 })
    .where(eq(users.id, userId));
}

private async lockAccount(userId: string): Promise<void> {
  const lockoutUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
  await this.db.db
    .update(users)
    .set({ lockoutUntil, failedLoginAttempts: MAX_LOGIN_ATTEMPTS })
    .where(eq(users.id, userId));
}

private async resetFailedLoginAttempts(userId: string): Promise<void> {
  await this.db.db
    .update(users)
    .set({ failedLoginAttempts: 0, lockoutUntil: null })
    .where(eq(users.id, userId));
}

private generateSecureToken(): string {
  return randomBytes(32).toString('base64url');
}

private hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
```

- [ ] **Step 6: Commit**

```bash
git add src/modules/auth/application/auth-application.service.ts
git commit -m "feat(auth): add account lockout logic to loginWithPassword

- Check lockoutUntil before allowing login
- Increment failedLoginAttempts on bad password
- Lock account after 10 failed attempts for 5 minutes
- Reset failed attempts count on successful login

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 8: Add Registration with Email Verification

**Files:**
- Modify: `src/modules/auth/application/auth-application.service.ts`
- Modify: `src/modules/auth/application/dto/auth.dto.ts`
- Modify: `src/modules/auth/presentation/auth.controller.ts`
- Modify: `src/modules/auth/infrastructure/auth.module.ts`

- [ ] **Step 1: Add RegisterDto to auth.dto.ts**

```typescript
// Add to src/modules/auth/application/dto/auth.dto.ts

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
```

- [ ] **Step 2: Add register method to AuthApplicationService**

```typescript
async register(dto: RegisterDto): Promise<AuthResult> {
  // Validate password complexity
  const validation = validatePassword(dto.password);
  if (!validation.isValid) {
    throw new HttpException(
      { code: 'AUTH_WEAK_PASSWORD', message: validation.errors.join(', ') },
      HttpStatus.BAD_REQUEST,
    );
  }

  // Check if user exists
  const existing = await this.userRepo.findByEmail(dto.email);
  if (existing) throw AuthException.invalidCredentials();

  // Hash password
  const passwordHash = await bcrypt.hash(dto.password, 12);

  // Generate verification token
  const verificationToken = this.generateSecureToken();
  const verificationTokenExpiry = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY_MS);

  // Create user
  const newUser = {
    id: crypto.randomUUID(),
    email: dto.email,
    passwordHash,
    name: dto.name,
    role: Role.USER,
    status: UserStatus.ACTIVE,
    emailVerified: false,
    verificationToken,
    verificationTokenExpiry,
    failedLoginAttempts: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  await this.db.db.insert(users).values(newUser);

  // Send verification email
  const baseUrl = this.env.get('APP_URL') || 'http://localhost:3000';
  const verificationUrl = `${baseUrl}/api/v1/auth/verify-email/${verificationToken}`;
  await this.emailService.send({
    to: dto.email,
    subject: getVerificationEmailSubject(),
    html: getVerificationEmailHtml(verificationUrl),
  });

  // Return auth result (but note email is not verified)
  return this.generateAuthResult(newUser.id, newUser.email, newUser.name, newUser.role);
}
```

- [ ] **Step 3: Add verifyEmail method**

```typescript
async verifyEmail(token: string): Promise<void> {
  // Find user by verification token
  const hashedToken = this.hashToken(token);
  const result = await this.db.db
    .select()
    .from(users)
    .where(eq(users.verificationToken, token))
    .limit(1);

  const user = result[0];
  if (!user) throw AuthException.invalidResetToken();
  if (user.verificationTokenExpiry && new Date(user.verificationTokenExpiry) < new Date()) {
    throw AuthException.resetTokenExpired();
  }

  // Update user as verified
  await this.db.db
    .update(users)
    .set({ emailVerified: true, verificationToken: null, verificationTokenExpiry: null })
    .where(eq(users.id, user.id));
}
```

- [ ] **Step 4: Add resendVerificationEmail method**

```typescript
async resendVerificationEmail(email: string): Promise<void> {
  const user = await this.userRepo.findByEmail(email);
  if (!user) return; // Silent fail for security

  if (user.emailVerified) return; // Already verified

  // Generate new token
  const verificationToken = this.generateSecureToken();
  const verificationTokenExpiry = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY_MS);

  await this.db.db
    .update(users)
    .set({ verificationToken, verificationTokenExpiry })
    .where(eq(users.id, user.id));

  // Send email
  const baseUrl = this.env.get('APP_URL') || 'http://localhost:3000';
  const verificationUrl = `${baseUrl}/api/v1/auth/verify-email/${verificationToken}`;
  await this.emailService.send({
    to: email,
    subject: getVerificationEmailSubject(),
    html: getVerificationEmailHtml(verificationUrl),
  });
}
```

- [ ] **Step 5: Update AuthController with new endpoints**

```typescript
@Public()
@Post('register')
@ApiOperation({ summary: 'Register a new user' })
@ApiResponse({ status: 201, type: AuthResponseDto })
async register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
  const result = await this.authService.register(dto);
  return {
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    user: result.user,
  };
}

@Public()
@Get('verify-email/:token')
@ApiOperation({ summary: 'Verify email address' })
@ApiResponse({ status: 200 })
async verifyEmail(@Param('token') token: string): Promise<{ message: string }> {
  await this.authService.verifyEmail(token);
  return { message: 'Email verified successfully' };
}

@Public()
@Post('resend-verification')
@ApiOperation({ summary: 'Resend verification email' })
@ApiResponse({ status: 200 })
async resendVerification(@Body() dto: ResendVerificationDto): Promise<{ message: string }> {
  await this.authService.resendVerificationEmail(dto.email);
  return { message: 'Verification email sent' };
}
```

- [ ] **Step 6: Add ResendVerificationDto**

```typescript
export class ResendVerificationDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;
}
```

- [ ] **Step 7: Import EmailModule in AuthModule**

```typescript
// src/modules/auth/infrastructure/auth.module.ts
import { EmailModule } from '../../../shared/infrastructure/email/email.module';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({}),
    DrizzleModule,
    RedisModule,
    UsersModule,
    EmailModule,  // Add this
  ],
  // ...
})
export class AuthModule {}
```

- [ ] **Step 8: Commit**

```bash
git add src/modules/auth/application/auth-application.service.ts
git add src/modules/auth/application/dto/auth.dto.ts
git add src/modules/auth/presentation/auth.controller.ts
git add src/modules/auth/infrastructure/auth.module.ts
git commit -m "feat(auth): add registration with email verification

- Register endpoint with password complexity validation
- Verify email endpoint with token validation
- Resend verification email endpoint
- Sends verification email on registration

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 9: Add Password Reset Endpoints

**Files:**
- Modify: `src/modules/auth/application/auth-application.service.ts`
- Modify: `src/modules/auth/application/dto/auth.dto.ts`
- Modify: `src/modules/auth/presentation/auth.controller.ts`

- [ ] **Step 1: Add ForgotPasswordDto and ResetPasswordDto**

```typescript
// Add to src/modules/auth/application/dto/auth.dto.ts

export class ForgotPasswordDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  token: string;

  @ApiProperty({ example: 'NewPassword123!' })
  @IsString()
  newPassword: string;
}
```

- [ ] **Step 2: Add forgotPassword method**

```typescript
async forgotPassword(email: string): Promise<void> {
  const user = await this.userRepo.findByEmail(email);
  if (!user) return; // Silent fail for security

  // Generate reset token
  const token = this.generateSecureToken();
  const tokenHash = this.hashToken(token);
  const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);

  // Store token
  await this.db.db.insert(passwordResetTokens).values({
    id: crypto.randomUUID(),
    userId: user.id,
    tokenHash,
    expiresAt,
  });

  // Send email
  const baseUrl = this.env.get('APP_URL') || 'http://localhost:3000';
  const resetUrl = `${baseUrl}/api/v1/auth/reset-password/${token}`;
  await this.emailService.send({
    to: email,
    subject: getPasswordResetEmailSubject(),
    html: getPasswordResetEmailHtml(resetUrl),
  });
}
```

- [ ] **Step 3: Add resetPassword method**

```typescript
async resetPassword(token: string, newPassword: string): Promise<void> {
  // Validate password complexity
  const validation = validatePassword(newPassword);
  if (!validation.isValid) {
    throw new HttpException(
      { code: 'AUTH_WEAK_PASSWORD', message: validation.errors.join(', ') },
      HttpStatus.BAD_REQUEST,
    );
  }

  // Find token
  const tokenHash = this.hashToken(token);
  const results = await this.db.db
    .select()
    .from(passwordResetTokens)
    .where(eq(passwordResetTokens.tokenHash, tokenHash))
    .limit(1);

  const resetRecord = results[0];
  if (!resetRecord) throw AuthException.invalidResetToken();
  if (new Date(resetRecord.expiresAt) < new Date()) throw AuthException.resetTokenExpired();

  // Hash new password
  const passwordHash = await bcrypt.hash(newPassword, 12);

  // Update user password
  await this.db.db
    .update(users)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(users.id, resetRecord.userId));

  // Delete used token
  await this.db.db.delete(passwordResetTokens).where(eq(passwordResetTokens.id, resetRecord.id));
}
```

- [ ] **Step 4: Add controller endpoints**

```typescript
@Public()
@Post('forgot-password')
@ApiOperation({ summary: 'Request password reset email' })
@ApiResponse({ status: 200 })
async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<{ message: string }> {
  await this.authService.forgotPassword(dto.email);
  return { message: 'If the email exists, a reset link has been sent' };
}

@Public()
@Post('reset-password')
@ApiOperation({ summary: 'Reset password with token' })
@ApiResponse({ status: 200 })
async resetPassword(@Body() dto: ResetPasswordDto): Promise<{ message: string }> {
  await this.authService.resetPassword(dto.token, dto.newPassword);
  return { message: 'Password reset successfully' };
}
```

- [ ] **Step 5: Commit**

```bash
git add src/modules/auth/application/auth-application.service.ts
git add src/modules/auth/application/dto/auth.dto.ts
git add src/modules/auth/presentation/auth.controller.ts
git commit -m "feat(auth): add password reset functionality

- Forgot password endpoint (sends reset email)
- Reset password endpoint (validates token, updates password)
- Tokens stored hashed, expire in 15 minutes

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 10: Add Magic Link Endpoints

**Files:**
- Modify: `src/modules/auth/application/auth-application.service.ts`
- Modify: `src/modules/auth/application/dto/auth.dto.ts`
- Modify: `src/modules/auth/presentation/auth.controller.ts`

- [ ] **Step 1: Add MagicLinkRequestDto**

```typescript
// Add to src/modules/auth/application/dto/auth.dto.ts

export class MagicLinkRequestDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;
}
```

- [ ] **Step 2: Add requestMagicLink method**

```typescript
async requestMagicLink(email: string): Promise<void> {
  const user = await this.userRepo.findByEmail(email);
  if (!user) return; // Silent fail for security

  // Generate magic link token
  const token = this.generateSecureToken();
  const tokenHash = this.hashToken(token);
  const expiresAt = new Date(Date.now() + MAGIC_LINK_EXPIRY_MS);

  // Store token
  await this.db.db.insert(magicLinks).values({
    id: crypto.randomUUID(),
    email,
    tokenHash,
    expiresAt,
  });

  // Send email
  const baseUrl = this.env.get('APP_URL') || 'http://localhost:3000';
  const magicLinkUrl = `${baseUrl}/api/v1/auth/magic-link/${token}`;
  await this.emailService.send({
    to: email,
    subject: getMagicLinkEmailSubject(),
    html: getMagicLinkEmailHtml(magicLinkUrl),
  });
}
```

- [ ] **Step 3: Add loginWithMagicLink method**

```typescript
async loginWithMagicLink(token: string): Promise<AuthResult> {
  const tokenHash = this.hashToken(token);

  // Find magic link
  const results = await this.db.db
    .select()
    .from(magicLinks)
    .where(eq(magicLinks.tokenHash, tokenHash))
    .limit(1);

  const magicLink = results[0];
  if (!magicLink) throw AuthException.invalidMagicLink();
  if (new Date(magicLink.expiresAt) < new Date()) throw AuthException.invalidMagicLink();

  // Find user
  const user = await this.userRepo.findByEmail(magicLink.email);
  if (!user) throw AuthException.invalidMagicLink();

  // Delete used magic link (single use)
  await this.db.db.delete(magicLinks).where(eq(magicLinks.id, magicLink.id));

  // Generate auth result
  return this.generateAuthResult(user.id, user.email, user.name, user.role);
}
```

- [ ] **Step 4: Add controller endpoints**

```typescript
@Public()
@Post('magic-link')
@ApiOperation({ summary: 'Request magic link' })
@ApiResponse({ status: 200 })
async requestMagicLink(@Body() dto: MagicLinkRequestDto): Promise<{ message: string }> {
  await this.authService.requestMagicLink(dto.email);
  return { message: 'If the email exists, a magic link has been sent' };
}

@Public()
@Get('magic-link/:token')
@ApiOperation({ summary: 'Login with magic link' })
@ApiResponse({ status: 200, type: AuthResponseDto })
async loginWithMagicLink(@Param('token') token: string): Promise<AuthResponseDto> {
  const result = await this.authService.loginWithMagicLink(token);
  return {
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    user: result.user,
  };
}
```

- [ ] **Step 5: Commit**

```bash
git add src/modules/auth/application/auth-application.service.ts
git add src/modules/auth/application/dto/auth.dto.ts
git add src/modules/auth/presentation/auth.controller.ts
git commit -m "feat(auth): add magic link authentication

- Request magic link endpoint (sends login link via email)
- Magic link login endpoint (validates token, returns session)
- Single-use tokens, expire in 15 minutes

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 11: Add Drizzle Migration

**Files:**
- Create: `drizzle/migrations/0000_add_security_fields.sql` (or similar)

- [ ] **Step 1: Generate migration**

Run: `pnpm drizzle-kit generate`

This will generate SQL migration files based on the schema changes.

- [ ] **Step 2: Review generated migration**

Check the generated migration file to ensure it includes:
- New columns on users table (emailVerified, lockoutUntil, failedLoginAttempts, verificationToken, verificationTokenExpiry)
- New password_reset_tokens table
- New magic_links table

- [ ] **Step 3: Commit migration**

```bash
git add drizzle/migrations/
git commit -m "chore(db): add security and email auth migration

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 12: Final Build and Test

**Files:**
- None (verification only)

- [ ] **Step 1: Run build**

Run: `pnpm build`
Expected: Exit code 0

- [ ] **Step 2: Run lint**

Run: `pnpm biome lint --write ./src`
Expected: Auto-fixes applied

- [ ] **Step 3: Run tests**

Run: `pnpm test`
Expected: All tests pass

- [ ] **Step 4: Commit any lint fixes**

```bash
git add -A
git commit -m "style: apply biome lint auto-fixes

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Summary

| Task | Description |
|------|-------------|
| 1 | Password validation utility |
| 2 | Users schema with lockout fields |
| 3 | New auth exceptions |
| 4 | Email service interface + console/SMTP |
| 5 | Password reset tokens schema |
| 6 | Magic links schema |
| 7 | Lockout logic in login |
| 8 | Registration + email verification |
| 9 | Password reset endpoints |
| 10 | Magic link endpoints |
| 11 | Drizzle migration |
| 12 | Final build and test |
