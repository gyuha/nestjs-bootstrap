# Phase 7: RBAC + WebSocket + Audit Log Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire EventEmitter2 events through existing RBAC services, build an Audit Log that records security events to DB, and add a WebSocket Gateway for real-time push notifications and in-memory chat.

**Architecture:** `@nestjs/event-emitter` acts as the internal event bus. `AuthService` and `UsersService` emit events on key actions. `AuditListener` consumes those events and writes to `audit_logs` table. `AppGateway` consumes the same events and pushes WebSocket notifications to affected users. A separate `ChatGateway` handles in-memory room-based chat.

**Tech Stack:** `@nestjs/event-emitter` (EventEmitter2), `@nestjs/websockets`, `@nestjs/platform-socket.io`, `socket.io`, Drizzle ORM (existing), NestJS Gateways

---

## Pre-read: What Already Exists

RBAC is **mostly implemented**. Before writing a single line, confirm these files exist:

- `src/modules/auth/decorators/roles.decorator.ts` — `@Roles()` decorator ✅
- `src/modules/auth/guards/roles.guard.ts` — `RolesGuard` ✅
- `src/modules/auth/guards/roles.guard.spec.ts` — guard tests ✅
- `src/modules/users/schemas/user.schema.ts` — `roles`, `userRoles`, `rolePermissions` tables ✅
- `src/modules/users/constants/permissions.ts` — `Permissions` constants ✅
- `src/modules/users/roles.controller.ts` — CRUD endpoints ✅
- `src/modules/users/users.service.ts` — `assignRole`, `removeRole`, `getUserRoles` methods ✅

**What this plan builds:**
1. EventEmitter2 setup + event emissions in existing services
2. Audit Log (schema, service, listener, module)
3. WebSocket Gateway (push + subscriptions)
4. Chat Gateway (in-memory rooms)

---

## File Map

**New files:**
```
src/shared/infrastructure/audit/schemas/audit-log.schema.ts
src/shared/infrastructure/audit/audit.service.ts
src/shared/infrastructure/audit/audit.service.spec.ts
src/shared/infrastructure/audit/audit.listener.ts
src/shared/infrastructure/audit/audit.listener.spec.ts
src/shared/infrastructure/audit/audit.module.ts
src/shared/infrastructure/gateway/gateway.service.ts
src/shared/infrastructure/gateway/gateway.service.spec.ts
src/shared/infrastructure/gateway/app.gateway.ts
src/shared/infrastructure/gateway/app.gateway.spec.ts
src/shared/infrastructure/gateway/gateway.module.ts
src/modules/chat/chat.gateway.ts
src/modules/chat/chat.gateway.spec.ts
src/modules/chat/chat.module.ts
```

**Modified files:**
```
package.json                                            ← add 4 packages
drizzle.config.ts                                       ← add shared schema glob
src/app.module.ts                                       ← add EventEmitterModule, GatewayModule, AuditModule, ChatModule
src/modules/auth/auth.service.ts                        ← inject EventEmitter2, emit 3 events
src/modules/auth/auth.service.spec.ts                   ← add EventEmitter2 mock
src/modules/users/users.service.ts                      ← inject EventEmitter2, emit 2 events
src/modules/users/users.service.spec.ts                 ← add EventEmitter2 mock
```

---

## Task 1: Install packages and set up EventEmitter

**Files:**
- Modify: `package.json`
- Modify: `src/app.module.ts`

- [ ] **Step 1: Install the four packages**

```bash
bun add @nestjs/websockets @nestjs/platform-socket.io @nestjs/event-emitter socket.io
```

Expected: packages appear in `package.json` dependencies.

- [ ] **Step 2: Add EventEmitterModule to AppModule**

Open `src/app.module.ts`. Add the import:

```typescript
import { EventEmitterModule } from '@nestjs/event-emitter';
```

Add to the `imports` array (before `HealthModule`):

```typescript
EventEmitterModule.forRoot(),
```

Full file after change:

```typescript
import {
  type MiddlewareConsumer,
  Module,
  type NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { pinoConfig } from './bootstrap/logging/pino.config';
import { TraceMiddleware } from './bootstrap/logging/trace.middleware';
import { validateEnv } from './bootstrap/validation/env.schema';
import { HealthModule } from './modules/health/health.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { SocialModule } from './modules/social/social.module';
import { AppCacheModule } from './shared/infrastructure/cache/cache.module';
import { DatabaseModule } from './shared/infrastructure/database/database.module';
import { RedisModule } from './shared/infrastructure/redis/redis.module';
import { EmailModule } from './shared/infrastructure/email/email.module';
import { QueueModule } from './shared/infrastructure/queue/queue.module';
import { StorageModule } from './shared/infrastructure/storage/storage.module';
import { ImageModule } from './shared/infrastructure/image/image.module';
import { FilesModule } from './modules/files/files.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV ?? 'development'}`,
      validate: validateEnv,
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
    LoggerModule.forRoot(pinoConfig),
    EventEmitterModule.forRoot(),
    DatabaseModule,
    RedisModule,
    QueueModule,
    EmailModule,
    StorageModule,
    ImageModule,
    FilesModule,
    AppCacheModule,
    HealthModule,
    UsersModule,
    AuthModule,
    SocialModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(TraceMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
```

- [ ] **Step 3: Run tests to confirm nothing is broken**

```bash
bun test
```

Expected: all existing tests pass.

- [ ] **Step 4: Commit**

```bash
git add package.json src/app.module.ts bun.lock
git commit -m "feat: install websocket/event-emitter packages and bootstrap EventEmitterModule"
```

---

## Task 2: Emit events from AuthService

**Files:**
- Modify: `src/modules/auth/auth.service.ts`
- Modify: `src/modules/auth/auth.service.spec.ts`

- [ ] **Step 1: Write the failing tests**

Open `src/modules/auth/auth.service.spec.ts`. Add `EventEmitter2` mock and three new test cases. Replace the full file with:

```typescript
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { REDIS_CLIENT } from '../../shared/infrastructure/redis/redis.provider';
import { QueueService } from '../../shared/infrastructure/queue/queue.service';

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
  let mockQueueService: { addJob: jest.Mock };
  let mockEventEmitter: { emit: jest.Mock };

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
    mockQueueService = {
      addJob: jest.fn().mockResolvedValue(undefined),
    };
    mockEventEmitter = {
      emit: jest.fn(),
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
            getOrThrow: jest.fn().mockImplementation((key: string) => {
              if (key === 'JWT_SECRET') return 'test-secret';
              if (key === 'API_BASE_URL') return 'http://localhost:3000';
              return undefined;
            }),
          },
        },
        { provide: REDIS_CLIENT, useValue: mockRedis },
        { provide: QueueService, useValue: mockQueueService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
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
    it('returns tokens', async () => {
      const result = await service.login(
        { email: 'test@example.com', password: 'password123' },
        { userId: 'uuid', email: 'test@example.com' },
        '127.0.0.1',
        'Mozilla/5.0',
      );

      expect(result.accessToken).toBe('mock-token');
    });

    it('emits auth.login event', async () => {
      await service.login(
        { email: 'test@example.com', password: 'password123' },
        { userId: 'uuid', email: 'test@example.com' },
        '127.0.0.1',
        'Mozilla/5.0',
      );

      expect(mockEventEmitter.emit).toHaveBeenCalledWith('auth.login', {
        userId: 'uuid',
        ip: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
      });
    });
  });

  describe('logout()', () => {
    it('clears refresh tokens and emits auth.logout event', async () => {
      mockRedis.keys.mockResolvedValue(['refresh:uuid:token']);

      await service.logout('uuid');

      expect(mockRedis.del).toHaveBeenCalledWith('refresh:uuid:token');
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('auth.logout', { userId: 'uuid' });
    });
  });

  describe('forgotPassword()', () => {
    it('silently returns for unknown email', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(service.forgotPassword('unknown@example.com')).resolves.not.toThrow();
      expect(mockQueueService.addJob).not.toHaveBeenCalled();
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

    it('updates password and emits auth.password-changed event', async () => {
      mockRedis.get.mockResolvedValue('user-uuid');

      await service.resetPassword('valid-token', 'newpassword123');

      expect(mockUsersService.updatePassword).toHaveBeenCalledWith('user-uuid', expect.any(String));
      expect(mockRedis.del).toHaveBeenCalledWith('email:password-reset:valid-token');
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('auth.password-changed', {
        userId: 'user-uuid',
      });
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

- [ ] **Step 2: Run tests — expect failures for the new event assertions**

```bash
bun test src/modules/auth/auth.service.spec.ts
```

Expected: FAIL — "Expected mock function to have been called with..."

- [ ] **Step 3: Update AuthService to inject EventEmitter2 and emit events**

Replace `src/modules/auth/auth.service.ts` with:

```typescript
import { randomBytes } from 'crypto';
import { Inject, Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as argon2 from 'argon2';
import { UsersService } from '../users/users.service';
import { REDIS_CLIENT } from '../../shared/infrastructure/redis/redis.provider';
import { QueueService } from '../../shared/infrastructure/queue/queue.service';
import type Redis from 'ioredis';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  private readonly refreshTokenTtl: number;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly queueService: QueueService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.refreshTokenTtl = this.config.get<number>('JWT_REFRESH_TTL') ?? 604800;
  }

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already in use');
    const user = await this.usersService.create(dto);

    const verifyToken = randomBytes(32).toString('hex');
    await this.redis.setex(`email:verify:${verifyToken}`, 86400, user.id);

    void this.queueService.addJob('email', { type: 'signup-confirmation', to: user.email, token: verifyToken });
    void this.queueService.addJob('email', { type: 'welcome', to: user.email });

    return this.generateTokens(user.id, user.email);
  }

  async login(_dto: LoginDto, user: { userId: string; email: string }, ip: string, userAgent: string) {
    void this.queueService.addJob('email', { type: 'login-alert', to: user.email, ip, userAgent });
    this.eventEmitter.emit('auth.login', { userId: user.userId, ip, userAgent });
    return this.generateTokens(user.userId, user.email);
  }

  async logout(userId: string) {
    const pattern = `refresh:${userId}:*`;
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
    this.eventEmitter.emit('auth.logout', { userId });
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    if (!user) return;

    const token = randomBytes(32).toString('hex');
    await this.redis.setex(`email:password-reset:${token}`, 3600, user.id);
    void this.queueService.addJob('email', { type: 'password-reset', to: user.email, token });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const userId = await this.redis.get(`email:password-reset:${token}`);
    if (!userId) throw new UnauthorizedException('Invalid or expired token');

    const passwordHash = await argon2.hash(newPassword);
    await this.usersService.updatePassword(userId, passwordHash);
    await this.redis.del(`email:password-reset:${token}`);
    this.eventEmitter.emit('auth.password-changed', { userId });
  }

  async verifyEmail(token: string): Promise<void> {
    const userId = await this.redis.get(`email:verify:${token}`);
    if (!userId) throw new UnauthorizedException('Invalid or expired token');

    await this.usersService.setEmailVerified(userId);
    await this.redis.del(`email:verify:${token}`);
  }

  async subscribeMarketing(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    if (!user) return;

    const token = randomBytes(32).toString('hex');
    await this.redis.setex(`email:subscribe:${token}`, 172800, user.id);
    void this.queueService.addJob('email', { type: 'subscription-confirm', to: user.email, token });
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
    await this.redis.setex(`email:unsubscribe:${token}`, 604800, userId);
    return token;
  }

  async refreshTokens(oldRefreshToken: string) {
    let payload: { sub: string; email: string };
    try {
      payload = this.jwtService.verify(oldRefreshToken, {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const storedToken = await this.redis.get(`refresh:${payload.sub}:token`);
    if (storedToken !== oldRefreshToken) {
      throw new UnauthorizedException('Refresh token reuse detected');
    }

    await this.redis.del(`refresh:${payload.sub}:token`);
    const tokens = this.generateTokens(payload.sub, payload.email);
    await this.redis.setex(
      `refresh:${payload.sub}:token`,
      this.refreshTokenTtl,
      tokens.refreshToken,
    );
    return tokens;
  }

  generateTokensForUser(userId: string, email: string) {
    return this.generateTokens(userId, email);
  }

  private generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.config.get<number>('JWT_ACCESS_TTL') ?? 1800,
      algorithm: 'HS512',
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.refreshTokenTtl,
      algorithm: 'HS512',
    });

    return { accessToken, refreshToken };
  }
}
```

- [ ] **Step 4: Run tests — expect pass**

```bash
bun test src/modules/auth/auth.service.spec.ts
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/modules/auth/auth.service.ts src/modules/auth/auth.service.spec.ts
git commit -m "feat: emit auth events (login, logout, password-changed) via EventEmitter2"
```

---

## Task 3: Emit events from UsersService on role assignment

**Files:**
- Modify: `src/modules/users/users.service.ts`
- Modify: `src/modules/users/users.service.spec.ts`

- [ ] **Step 1: Write the failing tests**

Open `src/modules/users/users.service.spec.ts`. Add `EventEmitter2` mock and two new test cases for `assignRole` and `removeRole`. Replace the full file:

```typescript
import { Test, type TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DRIZZLE_CLIENT } from '../../shared/infrastructure/database/database.token';
import { UsersService } from './users.service';

function createMockDb() {
  return {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
}

describe('UsersService', () => {
  let service: UsersService;
  // biome-ignore lint/suspicious/noExplicitAny: mock db type
  let mockDb: any;
  let mockEventEmitter: { emit: jest.Mock };

  beforeEach(async () => {
    mockDb = createMockDb();
    mockEventEmitter = { emit: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: DRIZZLE_CLIENT, useValue: mockDb },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('create', () => {
    it('should create a user with hashed password', async () => {
      const createUserDto = { email: 'test@example.com', password: 'password123' };
      const mockUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: createUserDto.email,
        passwordHash: '$argon2hash',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDb.insert.mockImplementation(() => ({
        values: () => ({ returning: () => [mockUser] }),
      }));

      const result = await service.create(createUserDto);
      expect(result.email).toBe(createUserDto.email);
      expect(result.isActive).toBe(true);
    });
  });

  describe('findByEmail', () => {
    it('should return a user by email', async () => {
      const mockUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        passwordHash: '$argon2hash',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDb.select.mockImplementation(() => ({
        from: () => ({ where: () => ({ limit: () => [mockUser] }) }),
      }));

      const result = await service.findByEmail('test@example.com');
      expect(result?.email).toBe('test@example.com');
    });

    it('should return null for non-existent email', async () => {
      mockDb.select.mockImplementation(() => ({
        from: () => ({ where: () => ({ limit: () => [] }) }),
      }));

      expect(await service.findByEmail('nonexistent@example.com')).toBeNull();
    });
  });

  describe('findById', () => {
    it('should return a user by id', async () => {
      const mockUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        passwordHash: '$argon2hash',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDb.select.mockImplementation(() => ({
        from: () => ({ where: () => ({ limit: () => [mockUser] }) }),
      }));

      const result = await service.findById(mockUser.id);
      expect(result?.id).toBe(mockUser.id);
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const mockUsers = [
        { id: '1', email: 'test1@example.com', passwordHash: '$argon2hash', isActive: true, createdAt: new Date(), updatedAt: new Date() },
        { id: '2', email: 'test2@example.com', passwordHash: '$argon2hash', isActive: true, createdAt: new Date(), updatedAt: new Date() },
      ];

      mockDb.select.mockImplementation(() => ({ from: () => mockUsers }));

      const result = await service.findAll();
      expect(result).toHaveLength(2);
    });
  });

  describe('update', () => {
    it('should update user fields', async () => {
      const updatedUser = { id: '123', email: 'new@example.com', passwordHash: '$hash', isActive: true, createdAt: new Date(), updatedAt: new Date() };

      mockDb.update.mockImplementation(() => ({
        set: () => ({ where: () => ({ returning: () => [updatedUser] }) }),
      }));

      const result = await service.update('123', { email: 'new@example.com' });
      expect(result?.email).toBe('new@example.com');
    });
  });

  describe('delete', () => {
    it('should delete a user', async () => {
      mockDb.delete.mockImplementation(() => ({
        where: () => ({ returning: () => [{ id: '123' }] }),
      }));

      await expect(service.delete('123')).resolves.toBeUndefined();
    });
  });

  describe('getUserRoles', () => {
    it('should return role names for a user', async () => {
      mockDb.select.mockImplementation(() => ({
        from: () => ({ innerJoin: () => ({ where: () => [{ name: 'admin' }, { name: 'user' }] }) }),
      }));

      const result = await service.getUserRoles('123e4567-e89b-12d3-a456-426614174000');
      expect(result).toContain('admin');
    });
  });

  describe('getUserPermissions', () => {
    it('should return permissions for a user', async () => {
      mockDb.select.mockImplementation(() => ({
        from: () => ({
          innerJoin: () => ({
            innerJoin: () => ({ where: () => [{ permission: 'users:read' }] }),
          }),
        }),
      }));

      const result = await service.getUserPermissions('123e4567-e89b-12d3-a456-426614174000');
      expect(result).toContain('users:read');
    });
  });

  describe('findAllRoles', () => {
    it('should return all roles', async () => {
      mockDb.select.mockImplementation(() => ({
        from: () => [{ id: '1', name: 'admin' }, { id: '2', name: 'user' }],
      }));

      expect(await service.findAllRoles()).toHaveLength(2);
    });
  });

  describe('findRoleById', () => {
    it('should return a role by id', async () => {
      mockDb.select.mockImplementation(() => ({
        from: () => ({ where: () => ({ limit: () => [{ id: '123', name: 'admin' }] }) }),
      }));

      const result = await service.findRoleById('123');
      expect(result?.name).toBe('admin');
    });
  });

  describe('createRole', () => {
    it('should create a new role', async () => {
      mockDb.insert.mockImplementation(() => ({
        values: () => ({ returning: () => [{ id: '123', name: 'moderator' }] }),
      }));

      const result = await service.createRole({ name: 'moderator' });
      expect(result.name).toBe('moderator');
    });
  });

  describe('updateRole', () => {
    it('should update a role', async () => {
      mockDb.update.mockImplementation(() => ({
        set: () => ({ where: () => ({ returning: () => [{ id: '123', name: 'admin', description: 'Updated' }] }) }),
      }));

      const result = await service.updateRole('123', { description: 'Updated' });
      expect(result?.description).toBe('Updated');
    });
  });

  describe('deleteRole', () => {
    it('should delete a role', async () => {
      mockDb.delete.mockImplementation(() => ({
        where: () => ({ returning: () => [{ id: '123' }] }),
      }));

      await expect(service.deleteRole('123')).resolves.toBeUndefined();
    });
  });

  describe('assignRole', () => {
    it('should assign a role to a user', async () => {
      mockDb.insert.mockImplementation(() => ({ values: () => ({}) }));

      await expect(
        service.assignRole('123e4567-e89b-12d3-a456-426614174000', '123'),
      ).resolves.toBeUndefined();
    });

    it('emits user.role-assigned event', async () => {
      mockDb.insert.mockImplementation(() => ({ values: () => ({}) }));

      await service.assignRole('user-id', 'role-id');

      expect(mockEventEmitter.emit).toHaveBeenCalledWith('user.role-assigned', {
        userId: 'user-id',
        roleId: 'role-id',
      });
    });
  });

  describe('removeRole', () => {
    it('should remove a role from a user', async () => {
      mockDb.delete.mockImplementation(() => ({ where: () => ({}) }));

      await expect(
        service.removeRole('123e4567-e89b-12d3-a456-426614174000', '123'),
      ).resolves.toBeUndefined();
    });

    it('emits user.role-removed event', async () => {
      mockDb.delete.mockImplementation(() => ({ where: () => ({}) }));

      await service.removeRole('user-id', 'role-id');

      expect(mockEventEmitter.emit).toHaveBeenCalledWith('user.role-removed', {
        userId: 'user-id',
        roleId: 'role-id',
      });
    });
  });

  describe('setRolePermissions', () => {
    it('should set permissions for a role', async () => {
      mockDb.delete.mockImplementation(() => ({ where: () => ({}) }));
      mockDb.insert.mockImplementation(() => ({ values: () => ({}) }));

      await expect(service.setRolePermissions('123', ['users:read'])).resolves.toBeUndefined();
    });
  });
});
```

- [ ] **Step 2: Run tests — expect failures on emit assertions**

```bash
bun test src/modules/users/users.service.spec.ts
```

Expected: FAIL — new event emission tests.

- [ ] **Step 3: Update UsersService to inject EventEmitter2 and emit on role changes**

Open `src/modules/users/users.service.ts`. Add EventEmitter2 import and injection, then update `assignRole` and `removeRole`. Replace the full file:

```typescript
import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { CreateUserDto } from './dto/create-user.dto';
import type { UpdateUserDto } from './dto/update-user.dto';
// biome-ignore lint/style/useImportType: NestJS DI requires runtime value for @Inject decorator
import { DRIZZLE_CLIENT } from '../../shared/infrastructure/database/database.token';
import * as schema from './schemas/user.schema';
import * as argon2 from 'argon2';

@Injectable()
export class UsersService {
  constructor(
    // biome-ignore lint/suspicious/noExplicitAny: drizzle client union type not statically resolvable
    @Inject(DRIZZLE_CLIENT) private readonly db: any,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateUserDto): Promise<schema.User> {
    const passwordHash = dto.password ? await argon2.hash(dto.password) : null;
    const [user] = await this.db
      .insert(schema.users)
      .values({ email: dto.email, passwordHash })
      .returning();
    return user;
  }

  async findByEmail(email: string): Promise<schema.User | null> {
    const [user] = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);
    return user ?? null;
  }

  async findById(id: string): Promise<schema.User | null> {
    const [user] = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, id))
      .limit(1);
    return user ?? null;
  }

  async findAll(): Promise<schema.User[]> {
    return this.db.select().from(schema.users);
  }

  async update(id: string, dto: UpdateUserDto): Promise<schema.User | null> {
    const [user] = await this.db
      .update(schema.users)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(schema.users.id, id))
      .returning();
    return user ?? null;
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(schema.users).where(eq(schema.users.id, id));
  }

  async getUserRoles(userId: string): Promise<string[]> {
    const results = await this.db
      .select({ name: schema.roles.name })
      .from(schema.userRoles)
      .innerJoin(schema.roles, eq(schema.userRoles.roleId, schema.roles.id))
      .where(eq(schema.userRoles.userId, userId));
    return results.map((r: { name: string }) => r.name);
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    const results = await this.db
      .select({ permission: schema.rolePermissions.permission })
      .from(schema.userRoles)
      .innerJoin(schema.roles, eq(schema.userRoles.roleId, schema.roles.id))
      .innerJoin(schema.rolePermissions, eq(schema.rolePermissions.roleId, schema.roles.id))
      .where(eq(schema.userRoles.userId, userId));
    return results.map((r: { permission: string }) => r.permission);
  }

  async assignRole(userId: string, roleId: string): Promise<void> {
    await this.db.insert(schema.userRoles).values({ userId, roleId });
    this.eventEmitter.emit('user.role-assigned', { userId, roleId });
  }

  async removeRole(userId: string, roleId: string): Promise<void> {
    await this.db
      .delete(schema.userRoles)
      .where(
        eq(schema.userRoles.userId, userId) &&
          eq(schema.userRoles.roleId, roleId),
      );
    this.eventEmitter.emit('user.role-removed', { userId, roleId });
  }

  async findAllRoles(): Promise<schema.Role[]> {
    return this.db.select().from(schema.roles);
  }

  async findRoleById(id: string): Promise<schema.Role | null> {
    const [role] = await this.db
      .select()
      .from(schema.roles)
      .where(eq(schema.roles.id, id))
      .limit(1);
    return role ?? null;
  }

  async createRole(dto: { name: string; description?: string }): Promise<schema.Role> {
    const [role] = await this.db
      .insert(schema.roles)
      .values({ name: dto.name, description: dto.description })
      .returning();
    return role;
  }

  async updateRole(id: string, dto: { name?: string; description?: string }): Promise<schema.Role | null> {
    const [role] = await this.db
      .update(schema.roles)
      .set(dto)
      .where(eq(schema.roles.id, id))
      .returning();
    return role ?? null;
  }

  async deleteRole(id: string): Promise<void> {
    await this.db.delete(schema.roles).where(eq(schema.roles.id, id));
  }

  async setRolePermissions(roleId: string, permissions: string[]): Promise<void> {
    await this.db.delete(schema.rolePermissions).where(eq(schema.rolePermissions.roleId, roleId));
    if (permissions.length > 0) {
      await this.db.insert(schema.rolePermissions).values(
        permissions.map((permission) => ({ roleId, permission })),
      );
    }
  }

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

  async setAvatarUrl(id: string, avatarUrl: string | null): Promise<void> {
    await this.db
      .update(schema.users)
      .set({ avatarUrl, updatedAt: new Date() })
      .where(eq(schema.users.id, id));
  }
}
```

- [ ] **Step 4: Run tests — expect pass**

```bash
bun test src/modules/users/users.service.spec.ts
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/modules/users/users.service.ts src/modules/users/users.service.spec.ts
git commit -m "feat: emit user.role-assigned and user.role-removed events via EventEmitter2"
```

---

## Task 4: Audit Log schema and drizzle config

**Files:**
- Modify: `drizzle.config.ts`
- Create: `src/shared/infrastructure/audit/schemas/audit-log.schema.ts`

- [ ] **Step 1: Update drizzle.config.ts to include shared infrastructure schemas**

Open `drizzle.config.ts`. Change the `schema` field from a single string to an array:

```typescript
import type { Config } from 'drizzle-kit';

const isProduction = process.env['NODE_ENV'] === 'production';

export default {
  dialect: isProduction ? 'postgresql' : 'sqlite',
  schema: [
    './src/modules/**/schemas/*.schema.ts',
    './src/shared/infrastructure/**/schemas/*.schema.ts',
  ],
  out: './src/shared/infrastructure/database/migrations',
  dbCredentials: isProduction
    ? { url: process.env['DATABASE_URL'] as string }
    : { url: process.env['DATABASE_URL'] ?? 'file:./dev.db' },
} satisfies Config;
```

- [ ] **Step 2: Create the audit log schema**

Create the directory and file `src/shared/infrastructure/audit/schemas/audit-log.schema.ts`:

```typescript
import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id'),
  action: text('action').notNull(),
  ip: text('ip'),
  userAgent: text('user_agent'),
  metadata: text('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
```

- [ ] **Step 3: Push schema to the dev SQLite database**

Make sure `DATABASE_URL` is set for your dev environment (check `.env.development`). Then push the schema:

```bash
bun run db:push
```

Expected: drizzle-kit creates the `audit_logs` table in the dev database. If you see errors about `pgTable` in SQLite mode, run:

```bash
NODE_ENV=development bun run db:push
```

- [ ] **Step 4: Commit**

```bash
git add drizzle.config.ts src/shared/infrastructure/audit/schemas/audit-log.schema.ts
git commit -m "feat: add audit_logs schema and update drizzle config to scan shared infrastructure"
```

---

## Task 5: AuditService

**Files:**
- Create: `src/shared/infrastructure/audit/audit.service.ts`
- Create: `src/shared/infrastructure/audit/audit.service.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `src/shared/infrastructure/audit/audit.service.spec.ts`:

```typescript
import { Test } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { DRIZZLE_CLIENT } from '../database/database.token';

describe('AuditService', () => {
  let service: AuditService;
  // biome-ignore lint/suspicious/noExplicitAny: mock db
  let mockDb: any;

  beforeEach(async () => {
    mockDb = {
      insert: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: DRIZZLE_CLIENT, useValue: mockDb },
      ],
    }).compile();

    service = module.get(AuditService);
  });

  it('inserts an audit log entry', async () => {
    const mockValues = jest.fn().mockResolvedValue(undefined);
    mockDb.insert.mockReturnValue({ values: mockValues });

    await service.log({
      userId: 'user-1',
      action: 'auth.login',
      ip: '127.0.0.1',
      userAgent: 'Mozilla/5.0',
    });

    expect(mockDb.insert).toHaveBeenCalled();
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'auth.login', ip: '127.0.0.1' }),
    );
  });

  it('handles null userId for unauthenticated events', async () => {
    const mockValues = jest.fn().mockResolvedValue(undefined);
    mockDb.insert.mockReturnValue({ values: mockValues });

    await service.log({ userId: null, action: 'auth.login' });

    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({ userId: null }),
    );
  });

  it('serializes metadata to JSON string', async () => {
    const mockValues = jest.fn().mockResolvedValue(undefined);
    mockDb.insert.mockReturnValue({ values: mockValues });

    await service.log({
      userId: 'user-1',
      action: 'user.role-assigned',
      metadata: { roleId: 'role-1' },
    });

    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({ metadata: '{"roleId":"role-1"}' }),
    );
  });
});
```

- [ ] **Step 2: Run test — expect failure**

```bash
bun test src/shared/infrastructure/audit/audit.service.spec.ts
```

Expected: FAIL — "Cannot find module './audit.service'"

- [ ] **Step 3: Implement AuditService**

Create `src/shared/infrastructure/audit/audit.service.ts`:

```typescript
import { Inject, Injectable } from '@nestjs/common';
// biome-ignore lint/style/useImportType: NestJS DI requires runtime value for @Inject decorator
import { DRIZZLE_CLIENT } from '../database/database.token';
import { auditLogs } from './schemas/audit-log.schema';

interface AuditLogData {
  userId?: string | null;
  action: string;
  ip?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
}

@Injectable()
export class AuditService {
  constructor(
    // biome-ignore lint/suspicious/noExplicitAny: drizzle client union type not statically resolvable
    @Inject(DRIZZLE_CLIENT) private readonly db: any,
  ) {}

  async log(data: AuditLogData): Promise<void> {
    await this.db.insert(auditLogs).values({
      userId: data.userId ?? null,
      action: data.action,
      ip: data.ip ?? null,
      userAgent: data.userAgent ?? null,
      metadata: data.metadata ? JSON.stringify(data.metadata) : null,
    });
  }
}
```

- [ ] **Step 4: Run test — expect pass**

```bash
bun test src/shared/infrastructure/audit/audit.service.spec.ts
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/shared/infrastructure/audit/audit.service.ts src/shared/infrastructure/audit/audit.service.spec.ts
git commit -m "feat: add AuditService with log() method"
```

---

## Task 6: AuditListener and AuditModule

**Files:**
- Create: `src/shared/infrastructure/audit/audit.listener.ts`
- Create: `src/shared/infrastructure/audit/audit.listener.spec.ts`
- Create: `src/shared/infrastructure/audit/audit.module.ts`
- Modify: `src/app.module.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/shared/infrastructure/audit/audit.listener.spec.ts`:

```typescript
import { Test } from '@nestjs/testing';
import { AuditListener } from './audit.listener';
import { AuditService } from './audit.service';

describe('AuditListener', () => {
  let listener: AuditListener;
  let mockAuditService: { log: jest.Mock };

  beforeEach(async () => {
    mockAuditService = { log: jest.fn().mockResolvedValue(undefined) };

    const module = await Test.createTestingModule({
      providers: [
        AuditListener,
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    listener = module.get(AuditListener);
  });

  it('logs auth.login event', async () => {
    await listener.handleLogin({ userId: 'user-1', ip: '127.0.0.1', userAgent: 'Mozilla/5.0' });

    expect(mockAuditService.log).toHaveBeenCalledWith({
      userId: 'user-1',
      action: 'auth.login',
      ip: '127.0.0.1',
      userAgent: 'Mozilla/5.0',
    });
  });

  it('logs auth.logout event', async () => {
    await listener.handleLogout({ userId: 'user-1' });

    expect(mockAuditService.log).toHaveBeenCalledWith({
      userId: 'user-1',
      action: 'auth.logout',
    });
  });

  it('logs auth.password-changed event', async () => {
    await listener.handlePasswordChanged({ userId: 'user-1' });

    expect(mockAuditService.log).toHaveBeenCalledWith({
      userId: 'user-1',
      action: 'auth.password-changed',
    });
  });

  it('logs user.role-assigned event with metadata', async () => {
    await listener.handleRoleAssigned({ userId: 'user-1', roleId: 'role-1' });

    expect(mockAuditService.log).toHaveBeenCalledWith({
      userId: 'user-1',
      action: 'user.role-assigned',
      metadata: { roleId: 'role-1' },
    });
  });

  it('logs user.role-removed event with metadata', async () => {
    await listener.handleRoleRemoved({ userId: 'user-1', roleId: 'role-1' });

    expect(mockAuditService.log).toHaveBeenCalledWith({
      userId: 'user-1',
      action: 'user.role-removed',
      metadata: { roleId: 'role-1' },
    });
  });
});
```

- [ ] **Step 2: Run test — expect failure**

```bash
bun test src/shared/infrastructure/audit/audit.listener.spec.ts
```

Expected: FAIL — "Cannot find module './audit.listener'"

- [ ] **Step 3: Implement AuditListener**

Create `src/shared/infrastructure/audit/audit.listener.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AuditService } from './audit.service';

@Injectable()
export class AuditListener {
  constructor(private readonly auditService: AuditService) {}

  @OnEvent('auth.login')
  async handleLogin(payload: { userId: string; ip: string; userAgent: string }): Promise<void> {
    await this.auditService.log({
      userId: payload.userId,
      action: 'auth.login',
      ip: payload.ip,
      userAgent: payload.userAgent,
    });
  }

  @OnEvent('auth.logout')
  async handleLogout(payload: { userId: string }): Promise<void> {
    await this.auditService.log({
      userId: payload.userId,
      action: 'auth.logout',
    });
  }

  @OnEvent('auth.password-changed')
  async handlePasswordChanged(payload: { userId: string }): Promise<void> {
    await this.auditService.log({
      userId: payload.userId,
      action: 'auth.password-changed',
    });
  }

  @OnEvent('user.role-assigned')
  async handleRoleAssigned(payload: { userId: string; roleId: string }): Promise<void> {
    await this.auditService.log({
      userId: payload.userId,
      action: 'user.role-assigned',
      metadata: { roleId: payload.roleId },
    });
  }

  @OnEvent('user.role-removed')
  async handleRoleRemoved(payload: { userId: string; roleId: string }): Promise<void> {
    await this.auditService.log({
      userId: payload.userId,
      action: 'user.role-removed',
      metadata: { roleId: payload.roleId },
    });
  }
}
```

- [ ] **Step 4: Run test — expect pass**

```bash
bun test src/shared/infrastructure/audit/audit.listener.spec.ts
```

Expected: all tests PASS.

- [ ] **Step 5: Create AuditModule**

Create `src/shared/infrastructure/audit/audit.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AuditService } from './audit.service';
import { AuditListener } from './audit.listener';

@Module({
  imports: [DatabaseModule],
  providers: [AuditService, AuditListener],
})
export class AuditModule {}
```

- [ ] **Step 6: Register AuditModule in AppModule**

Open `src/app.module.ts`. Add:

```typescript
import { AuditModule } from './shared/infrastructure/audit/audit.module';
```

Add `AuditModule` to the `imports` array (after `EventEmitterModule.forRoot()`):

```typescript
EventEmitterModule.forRoot(),
AuditModule,
```

- [ ] **Step 7: Run full test suite**

```bash
bun test
```

Expected: all tests PASS.

- [ ] **Step 8: Commit**

```bash
git add src/shared/infrastructure/audit/ src/app.module.ts
git commit -m "feat: add AuditModule with AuditListener recording security events to audit_logs"
```

---

## Task 7: GatewayService

**Files:**
- Create: `src/shared/infrastructure/gateway/gateway.service.ts`
- Create: `src/shared/infrastructure/gateway/gateway.service.spec.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/shared/infrastructure/gateway/gateway.service.spec.ts`:

```typescript
import { Test } from '@nestjs/testing';
import { GatewayService } from './gateway.service';

describe('GatewayService', () => {
  let service: GatewayService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [GatewayService],
    }).compile();

    service = module.get(GatewayService);
  });

  const makeServer = () => {
    const emitFn = jest.fn();
    const toFn = jest.fn().mockReturnValue({ emit: emitFn });
    return { server: { to: toFn }, emitFn, toFn };
  };

  it('registers socket and sends message to user', () => {
    const { server, toFn, emitFn } = makeServer();
    service.setServer(server as any);
    service.registerSocket('user-1', 'socket-a');

    service.sendToUser('user-1', 'test-event', { hello: 'world' });

    expect(toFn).toHaveBeenCalledWith('socket-a');
    expect(emitFn).toHaveBeenCalledWith('test-event', { hello: 'world' });
  });

  it('sends to all sockets for a user with multiple connections', () => {
    const { server, toFn } = makeServer();
    service.setServer(server as any);
    service.registerSocket('user-1', 'socket-a');
    service.registerSocket('user-1', 'socket-b');

    service.sendToUser('user-1', 'event', {});

    expect(toFn).toHaveBeenCalledTimes(2);
  });

  it('does nothing when server is not set', () => {
    expect(() => service.sendToUser('user-1', 'event', {})).not.toThrow();
  });

  it('does nothing for unknown user', () => {
    const { server, toFn } = makeServer();
    service.setServer(server as any);

    service.sendToUser('unknown-user', 'event', {});

    expect(toFn).not.toHaveBeenCalled();
  });

  it('unregisters a socket and stops sending to it', () => {
    const { server, toFn } = makeServer();
    service.setServer(server as any);
    service.registerSocket('user-1', 'socket-a');
    service.unregisterSocket('user-1', 'socket-a');

    service.sendToUser('user-1', 'event', {});

    expect(toFn).not.toHaveBeenCalled();
  });

  it('sends to room', () => {
    const { server, toFn, emitFn } = makeServer();
    service.setServer(server as any);

    service.sendToRoom('room-1', 'room-event', { data: 1 });

    expect(toFn).toHaveBeenCalledWith('room-1');
    expect(emitFn).toHaveBeenCalledWith('room-event', { data: 1 });
  });
});
```

- [ ] **Step 2: Run test — expect failure**

```bash
bun test src/shared/infrastructure/gateway/gateway.service.spec.ts
```

Expected: FAIL — "Cannot find module './gateway.service'"

- [ ] **Step 3: Implement GatewayService**

Create `src/shared/infrastructure/gateway/gateway.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import type { Server } from 'socket.io';

@Injectable()
export class GatewayService {
  private server: Server | null = null;
  private readonly userSockets = new Map<string, Set<string>>();

  setServer(server: Server): void {
    this.server = server;
  }

  registerSocket(userId: string, socketId: string): void {
    const sockets = this.userSockets.get(userId) ?? new Set<string>();
    sockets.add(socketId);
    this.userSockets.set(userId, sockets);
  }

  unregisterSocket(userId: string, socketId: string): void {
    const sockets = this.userSockets.get(userId);
    if (!sockets) return;
    sockets.delete(socketId);
    if (sockets.size === 0) this.userSockets.delete(userId);
  }

  sendToUser(userId: string, event: string, data: unknown): void {
    if (!this.server) return;
    const sockets = this.userSockets.get(userId);
    if (!sockets) return;
    for (const socketId of sockets) {
      this.server.to(socketId).emit(event, data);
    }
  }

  sendToRoom(room: string, event: string, data: unknown): void {
    this.server?.to(room).emit(event, data);
  }
}
```

- [ ] **Step 4: Run test — expect pass**

```bash
bun test src/shared/infrastructure/gateway/gateway.service.spec.ts
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/shared/infrastructure/gateway/gateway.service.ts src/shared/infrastructure/gateway/gateway.service.spec.ts
git commit -m "feat: add GatewayService for WebSocket send-to-user and send-to-room"
```

---

## Task 8: AppGateway

**Files:**
- Create: `src/shared/infrastructure/gateway/app.gateway.ts`
- Create: `src/shared/infrastructure/gateway/app.gateway.spec.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/shared/infrastructure/gateway/app.gateway.spec.ts`:

```typescript
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AppGateway } from './app.gateway';
import { GatewayService } from './gateway.service';

describe('AppGateway', () => {
  let gateway: AppGateway;
  let mockGatewayService: {
    setServer: jest.Mock;
    registerSocket: jest.Mock;
    unregisterSocket: jest.Mock;
    sendToUser: jest.Mock;
  };
  let mockJwtService: { verify: jest.Mock };

  beforeEach(async () => {
    mockGatewayService = {
      setServer: jest.fn(),
      registerSocket: jest.fn(),
      unregisterSocket: jest.fn(),
      sendToUser: jest.fn(),
    };
    mockJwtService = { verify: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        AppGateway,
        { provide: GatewayService, useValue: mockGatewayService },
        { provide: JwtService, useValue: mockJwtService },
        {
          provide: ConfigService,
          useValue: { getOrThrow: jest.fn().mockReturnValue('test-secret') },
        },
      ],
    }).compile();

    gateway = module.get(AppGateway);
  });

  const createClient = (token?: string) => ({
    handshake: { auth: { token } },
    data: {} as Record<string, unknown>,
    id: 'socket-id',
    disconnect: jest.fn(),
    join: jest.fn(),
    leave: jest.fn(),
  });

  it('disconnects client with no token', () => {
    const client = createClient();
    gateway.handleConnection(client as any);
    expect(client.disconnect).toHaveBeenCalled();
  });

  it('disconnects client with invalid token', () => {
    mockJwtService.verify.mockImplementation(() => { throw new Error('invalid'); });
    const client = createClient('bad-token');
    gateway.handleConnection(client as any);
    expect(client.disconnect).toHaveBeenCalled();
  });

  it('registers authenticated client', () => {
    mockJwtService.verify.mockReturnValue({ sub: 'user-1' });
    const client = createClient('valid-token');
    gateway.handleConnection(client as any);
    expect(mockGatewayService.registerSocket).toHaveBeenCalledWith('user-1', 'socket-id');
    expect(client.data['userId']).toBe('user-1');
  });

  it('unregisters on disconnect', () => {
    const client = createClient();
    client.data['userId'] = 'user-1';
    gateway.handleDisconnect(client as any);
    expect(mockGatewayService.unregisterSocket).toHaveBeenCalledWith('user-1', 'socket-id');
  });

  it('joins room on subscribe', () => {
    const client = createClient();
    gateway.handleSubscribe(client as any, 'my-topic');
    expect(client.join).toHaveBeenCalledWith('my-topic');
  });

  it('leaves room on unsubscribe', () => {
    const client = createClient();
    gateway.handleUnsubscribe(client as any, 'my-topic');
    expect(client.leave).toHaveBeenCalledWith('my-topic');
  });

  it('forwards role-assigned event to user via WS', () => {
    gateway.handleRoleAssigned({ userId: 'user-1', roleId: 'role-1' });
    expect(mockGatewayService.sendToUser).toHaveBeenCalledWith(
      'user-1', 'role-assigned', { userId: 'user-1', roleId: 'role-1' },
    );
  });

  it('forwards role-removed event to user via WS', () => {
    gateway.handleRoleRemoved({ userId: 'user-1', roleId: 'role-1' });
    expect(mockGatewayService.sendToUser).toHaveBeenCalledWith(
      'user-1', 'role-removed', { userId: 'user-1', roleId: 'role-1' },
    );
  });

  it('forwards login-detected event to user via WS', () => {
    gateway.handleLoginEvent({ userId: 'user-1', ip: '127.0.0.1', userAgent: 'Mozilla' });
    expect(mockGatewayService.sendToUser).toHaveBeenCalledWith(
      'user-1', 'login-detected', { userId: 'user-1', ip: '127.0.0.1', userAgent: 'Mozilla' },
    );
  });
});
```

- [ ] **Step 2: Run test — expect failure**

```bash
bun test src/shared/infrastructure/gateway/app.gateway.spec.ts
```

Expected: FAIL — "Cannot find module './app.gateway'"

- [ ] **Step 3: Implement AppGateway**

Create `src/shared/infrastructure/gateway/app.gateway.ts`:

```typescript
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { OnEvent } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { Server, Socket } from 'socket.io';
import { GatewayService } from './gateway.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class AppGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;

  constructor(
    private readonly gatewayService: GatewayService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  afterInit(server: Server): void {
    this.gatewayService.setServer(server);
  }

  handleConnection(client: Socket): void {
    const token = client.handshake.auth['token'] as string | undefined;
    if (!token) {
      client.disconnect();
      return;
    }
    try {
      const payload = this.jwtService.verify<{ sub: string }>(token, {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
      });
      client.data['userId'] = payload.sub;
      this.gatewayService.registerSocket(payload.sub, client.id);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket): void {
    const userId = client.data['userId'] as string | undefined;
    if (userId) {
      this.gatewayService.unregisterSocket(userId, client.id);
    }
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(client: Socket, topic: string): void {
    client.join(topic);
  }

  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(client: Socket, topic: string): void {
    client.leave(topic);
  }

  @OnEvent('user.role-assigned')
  handleRoleAssigned(payload: { userId: string; roleId: string }): void {
    this.gatewayService.sendToUser(payload.userId, 'role-assigned', payload);
  }

  @OnEvent('user.role-removed')
  handleRoleRemoved(payload: { userId: string; roleId: string }): void {
    this.gatewayService.sendToUser(payload.userId, 'role-removed', payload);
  }

  @OnEvent('auth.login')
  handleLoginEvent(payload: { userId: string; ip: string; userAgent: string }): void {
    this.gatewayService.sendToUser(payload.userId, 'login-detected', payload);
  }
}
```

- [ ] **Step 4: Run test — expect pass**

```bash
bun test src/shared/infrastructure/gateway/app.gateway.spec.ts
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/shared/infrastructure/gateway/app.gateway.ts src/shared/infrastructure/gateway/app.gateway.spec.ts
git commit -m "feat: add AppGateway with JWT auth, topic subscriptions, and event-driven WS push"
```

---

## Task 9: GatewayModule and register in AppModule

**Files:**
- Create: `src/shared/infrastructure/gateway/gateway.module.ts`
- Modify: `src/app.module.ts`

- [ ] **Step 1: Create GatewayModule**

Create `src/shared/infrastructure/gateway/gateway.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { GatewayService } from './gateway.service';
import { AppGateway } from './app.gateway';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: { algorithm: 'HS512' },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [GatewayService, AppGateway],
  exports: [GatewayService],
})
export class GatewayModule {}
```

- [ ] **Step 2: Register GatewayModule in AppModule**

Open `src/app.module.ts`. Add:

```typescript
import { GatewayModule } from './shared/infrastructure/gateway/gateway.module';
```

Add `GatewayModule` to the `imports` array (after `AuditModule`):

```typescript
EventEmitterModule.forRoot(),
AuditModule,
GatewayModule,
```

- [ ] **Step 3: Run full test suite**

```bash
bun test
```

Expected: all tests PASS.

- [ ] **Step 4: Commit**

```bash
git add src/shared/infrastructure/gateway/gateway.module.ts src/app.module.ts
git commit -m "feat: add GatewayModule and register in AppModule"
```

---

## Task 10: ChatGateway and ChatModule

**Files:**
- Create: `src/modules/chat/chat.gateway.ts`
- Create: `src/modules/chat/chat.gateway.spec.ts`
- Create: `src/modules/chat/chat.module.ts`
- Modify: `src/app.module.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/modules/chat/chat.gateway.spec.ts`:

```typescript
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ChatGateway } from './chat.gateway';

describe('ChatGateway', () => {
  let gateway: ChatGateway;
  let mockJwtService: { verify: jest.Mock };

  beforeEach(async () => {
    mockJwtService = { verify: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        ChatGateway,
        { provide: JwtService, useValue: mockJwtService },
        {
          provide: ConfigService,
          useValue: { getOrThrow: jest.fn().mockReturnValue('test-secret') },
        },
      ],
    }).compile();

    gateway = module.get(ChatGateway);
  });

  const createClient = (token?: string) => ({
    handshake: { auth: { token } },
    data: {} as Record<string, unknown>,
    id: 'socket-id',
    disconnect: jest.fn(),
    join: jest.fn(),
    leave: jest.fn(),
    to: jest.fn().mockReturnValue({ emit: jest.fn() }),
  });

  it('disconnects client with no token', () => {
    const client = createClient();
    gateway.handleConnection(client as any);
    expect(client.disconnect).toHaveBeenCalled();
  });

  it('disconnects client with invalid token', () => {
    mockJwtService.verify.mockImplementation(() => { throw new Error('invalid'); });
    const client = createClient('bad');
    gateway.handleConnection(client as any);
    expect(client.disconnect).toHaveBeenCalled();
  });

  it('authenticates valid client', () => {
    mockJwtService.verify.mockReturnValue({ sub: 'user-1', email: 'u@example.com' });
    const client = createClient('valid-token');
    gateway.handleConnection(client as any);
    expect(client.data['userId']).toBe('user-1');
    expect(client.disconnect).not.toHaveBeenCalled();
  });

  it('joins a chat room', () => {
    const client = createClient();
    client.data['userId'] = 'user-1';
    gateway.handleJoin(client as any, 'room-1');
    expect(client.join).toHaveBeenCalledWith('room-1');
  });

  it('leaves a chat room', () => {
    const client = createClient();
    client.data['userId'] = 'user-1';
    gateway.handleLeave(client as any, 'room-1');
    expect(client.leave).toHaveBeenCalledWith('room-1');
  });

  it('broadcasts chat message to room', () => {
    const emitFn = jest.fn();
    const toFn = jest.fn().mockReturnValue({ emit: emitFn });
    const mockServer = { to: toFn };
    gateway.server = mockServer as any;

    const client = createClient();
    client.data['userId'] = 'user-1';
    gateway.handleMessage(client as any, { room: 'room-1', message: 'Hello!' });

    expect(toFn).toHaveBeenCalledWith('room-1');
    expect(emitFn).toHaveBeenCalledWith(
      'chat.message',
      expect.objectContaining({ userId: 'user-1', message: 'Hello!' }),
    );
  });
});
```

- [ ] **Step 2: Run test — expect failure**

```bash
bun test src/modules/chat/chat.gateway.spec.ts
```

Expected: FAIL — "Cannot find module './chat.gateway'"

- [ ] **Step 3: Implement ChatGateway**

Create `src/modules/chat/chat.gateway.ts`:

```typescript
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { Server, Socket } from 'socket.io';

@WebSocketGateway({ namespace: 'chat', cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  handleConnection(client: Socket): void {
    const token = client.handshake.auth['token'] as string | undefined;
    if (!token) {
      client.disconnect();
      return;
    }
    try {
      const payload = this.jwtService.verify<{ sub: string; email: string }>(token, {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
      });
      client.data['userId'] = payload.sub;
      client.data['email'] = payload.email;
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(_client: Socket): void {}

  @SubscribeMessage('chat.join')
  handleJoin(client: Socket, room: string): void {
    client.join(room);
    client.to(room).emit('chat.joined', { userId: client.data['userId'] });
  }

  @SubscribeMessage('chat.leave')
  handleLeave(client: Socket, room: string): void {
    client.leave(room);
    client.to(room).emit('chat.left', { userId: client.data['userId'] });
  }

  @SubscribeMessage('chat.message')
  handleMessage(client: Socket, payload: { room: string; message: string }): void {
    this.server.to(payload.room).emit('chat.message', {
      userId: client.data['userId'],
      message: payload.message,
      timestamp: new Date().toISOString(),
    });
  }
}
```

- [ ] **Step 4: Run test — expect pass**

```bash
bun test src/modules/chat/chat.gateway.spec.ts
```

Expected: all tests PASS.

- [ ] **Step 5: Create ChatModule**

Create `src/modules/chat/chat.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ChatGateway } from './chat.gateway';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: { algorithm: 'HS512' },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [ChatGateway],
})
export class ChatModule {}
```

- [ ] **Step 6: Register ChatModule in AppModule**

Open `src/app.module.ts`. Add:

```typescript
import { ChatModule } from './modules/chat/chat.module';
```

Add `ChatModule` to the `imports` array after `GatewayModule`:

```typescript
EventEmitterModule.forRoot(),
AuditModule,
GatewayModule,
ChatModule,
```

- [ ] **Step 7: Run full test suite**

```bash
bun test
```

Expected: all tests PASS.

- [ ] **Step 8: Run Biome checks**

```bash
bun run check
```

Fix any lint or format issues reported. Then run `bun run format` if needed.

- [ ] **Step 9: Commit**

```bash
git add src/modules/chat/ src/app.module.ts
git commit -m "feat: add ChatGateway with in-memory room-based chat and ChatModule"
```

---

## Task 11: Final wiring verification

- [ ] **Step 1: Run the full test suite one more time**

```bash
bun test
```

Expected: all tests PASS. Note the count — if any tests fail, fix them before proceeding.

- [ ] **Step 2: Run Biome lint and format check**

```bash
bun run check
```

Expected: no errors. If format issues found, run `bun run format` then `bun run check` again.

- [ ] **Step 3: Verify AppModule imports are complete**

Open `src/app.module.ts` and confirm all four new additions are present:
- `EventEmitterModule.forRoot()` ✅
- `AuditModule` ✅
- `GatewayModule` ✅
- `ChatModule` ✅

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "chore: Phase 7 complete — RBAC events, AuditLog, WebSocket gateway, and chat"
```

---

## Acceptance Checklist

- [ ] `bun test` passes — all tests green
- [ ] `bun run check` passes — no Biome errors
- [ ] `auth.login`, `auth.logout`, `auth.password-changed` events emitted from `AuthService`
- [ ] `user.role-assigned`, `user.role-removed` events emitted from `UsersService`
- [ ] `AuditListener` records all 5 event types to `audit_logs` DB table
- [ ] Unauthenticated WebSocket connection is rejected (disconnected immediately)
- [ ] Authenticated client can subscribe to topics and receive pushes
- [ ] Role assignment triggers WebSocket notification to affected user
- [ ] Chat room join/leave/message broadcasts work in-memory
- [ ] `audit_logs` table exists in dev database (after `db:push`)
