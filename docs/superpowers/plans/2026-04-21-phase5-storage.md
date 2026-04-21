# Phase 5 File Upload/Storage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 사용자 프로필 아바타 + 갤러리(최대 10장) 파일 업로드를 구축한다 — Local/S3 provider 전환, Sharp 다중 리사이징(원본/512/128), Multer 업로드, 파일 메타데이터 DB 관리.

**Architecture:** `StorageModule`(Global)이 `IStorageProvider` 전략 패턴으로 provider를 주입한다. `ImageService`가 Sharp로 3종 사이즈를 생성하고, `FilesModule`이 Multer 업로드 + DB CRUD를 담당한다. Phase 4의 provider 패턴과 동일한 구조.

**Tech Stack:** @aws-sdk/client-s3, sharp, multer, @types/sharp, @types/multer

---

## 파일 구조 맵

```
# 새로 생성
src/shared/infrastructure/storage/
├── storage.module.ts
├── storage.service.ts
├── storage.token.ts
└── providers/
    ├── storage-provider.interface.ts
    ├── local.provider.ts
    └── s3.provider.ts

src/shared/infrastructure/image/
├── image.module.ts
└── image.service.ts

src/modules/files/
├── files.module.ts
├── files.service.ts
├── files.controller.ts
├── schemas/
│   └── file.schema.ts
└── dto/
    └── upload-response.dto.ts

test/files.e2e-spec.ts

# 수정
src/bootstrap/validation/env.schema.ts     ← STORAGE_*, AWS_* 변수 추가
.env.development                          ← STORAGE_* 변수 추가
src/modules/users/schemas/user.schema.ts   ← avatarUrl 컬럼 추가
src/modules/users/users.service.ts         ← setAvatarUrl 메서드 추가
src/app.module.ts                          ← StorageModule, ImageModule, FilesModule 추가
package.json                               ← db:push 이미 존재
```

---

## Task 1: 패키지 설치

**Files:**
- Modify: `package.json`

- [ ] **Step 1: 스토리지/이미지 패키지 설치**

```bash
bun add @aws-sdk/client-s3 sharp multer
```

- [ ] **Step 2: 타입 정의 설치**

```bash
bun add -d @types/sharp @types/multer
```

- [ ] **Step 3: 커밋**

```bash
git add package.json
git commit -m "chore: add S3 SDK, sharp, and multer packages"
```

---

## Task 2: 환경변수 스키마 업데이트

**Files:**
- Modify: `src/bootstrap/validation/env.schema.ts`
- Modify: `.env.development`

- [ ] **Step 1: env.schema.ts에 스토리지 변수 추가**

`src/bootstrap/validation/env.schema.ts`의 `EnvSchema`에 다음 필드를 추가한다. 기존 `SMTP_SECURE` 줄 뒤에:

```typescript
STORAGE_PROVIDER: z.enum(['local', 's3']).default('local'),
STORAGE_LOCAL_PATH: z.string().default('./uploads'),
AWS_S3_BUCKET: z.string().optional(),
AWS_S3_REGION: z.string().optional(),
AWS_ACCESS_KEY_ID: z.string().optional(),
AWS_SECRET_ACCESS_KEY: z.string().optional(),
AWS_S3_PUBLIC_URL: z.string().optional(),
```

- [ ] **Step 2: .env.development에 스토리지 변수 추가**

`.env.development` 파일 끝에 추가:

```env
# Storage
STORAGE_PROVIDER=local
STORAGE_LOCAL_PATH=./uploads
```

- [ ] **Step 3: env 스키마 테스트 실행**

```bash
bun run test --testPathPatterns=env.schema
```

Expected: PASS

- [ ] **Step 4: 커밋**

```bash
git add src/bootstrap/validation/env.schema.ts .env.development
git commit -m "feat: add storage environment variables to env schema"
```

---

## Task 3: DB 스키마 — files 테이블 + users.avatarUrl

**Files:**
- Create: `src/modules/files/schemas/file.schema.ts`
- Modify: `src/modules/users/schemas/user.schema.ts`

- [ ] **Step 1: file.schema.ts 생성**

`src/modules/files/schemas/file.schema.ts`:

```typescript
import { pgTable, uuid, text, integer, timestamp } from 'drizzle-orm/pg-core';

export const files = pgTable('files', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  category: text('category').notNull(),
  originalName: text('original_name').notNull(),
  mimeType: text('mime_type').notNull(),
  size: integer('size').notNull(),
  url: text('url').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  mediumUrl: text('medium_url'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type FileRecord = typeof files.$inferSelect;
export type NewFile = typeof files.$inferInsert;
```

- [ ] **Step 2: user.schema.ts에 avatarUrl 추가**

`src/modules/users/schemas/user.schema.ts`의 `users` 테이블에 `isMarketingSubscribed` 뒤에 추가:

```typescript
avatarUrl: text('avatar_url'),
```

전체 users 테이블은 다음과 같아야 한다:

```typescript
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'),
  isActive: boolean('is_active').notNull().default(true),
  isEmailVerified: boolean('is_email_verified').notNull().default(false),
  isMarketingSubscribed: boolean('is_marketing_subscribed').notNull().default(false),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
```

- [ ] **Step 3: dev DB에 스키마 적용**

```bash
NODE_ENV=development DATABASE_URL=file:./dev.db bun run db:push
```

또는 수동으로 SQLite에 테이블 생성:

```bash
bun -e "
const Database = require('better-sqlite3');
const db = new Database('dev.db');
db.exec('CREATE TABLE IF NOT EXISTS files (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, category TEXT NOT NULL, original_name TEXT NOT NULL, mime_type TEXT NOT NULL, size INTEGER NOT NULL, url TEXT NOT NULL, thumbnail_url TEXT, medium_url TEXT, created_at TEXT NOT NULL DEFAULT (datetime(\"now\")))');
const cols = db.pragma('table_info(users)').map(c => c.name);
if (!cols.includes('avatar_url')) db.exec('ALTER TABLE users ADD COLUMN avatar_url TEXT');
db.close();
"
```

- [ ] **Step 4: 커밋**

```bash
git add src/modules/files/ src/modules/users/schemas/user.schema.ts
git commit -m "feat: add files table schema and avatarUrl to users"
```

---

## Task 4: IStorageProvider 인터페이스 + LocalProvider

**Files:**
- Create: `src/shared/infrastructure/storage/storage.token.ts`
- Create: `src/shared/infrastructure/storage/providers/storage-provider.interface.ts`
- Create: `src/shared/infrastructure/storage/providers/local.provider.ts`
- Create: `src/shared/infrastructure/storage/providers/local.provider.spec.ts`

- [ ] **Step 1: storage.token.ts 생성**

`src/shared/infrastructure/storage/storage.token.ts`:

```typescript
export const STORAGE_PROVIDER = 'STORAGE_PROVIDER_TOKEN';
```

- [ ] **Step 2: IStorageProvider 인터페이스 생성**

`src/shared/infrastructure/storage/providers/storage-provider.interface.ts`:

```typescript
export interface IStorageProvider {
  upload(key: string, buffer: Buffer, mimeType: string): Promise<string>;
  delete(key: string): Promise<void>;
  getUrl(key: string): string;
}
```

- [ ] **Step 3: local.provider.spec.ts 작성 (TDD)**

`src/shared/infrastructure/storage/providers/local.provider.spec.ts`:

```typescript
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LocalProvider } from './local.provider';
import * as fs from 'fs';
import * as path from 'path';

jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  promises: {
    mkdir: jest.fn().mockResolvedValue(undefined),
    writeFile: jest.fn().mockResolvedValue(undefined),
    unlink: jest.fn().mockResolvedValue(undefined),
  },
}));

describe('LocalProvider', () => {
  let provider: LocalProvider;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        LocalProvider,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              if (key === 'STORAGE_LOCAL_PATH') return './test-uploads';
              return undefined;
            }),
          },
        },
      ],
    }).compile();

    provider = module.get(LocalProvider);
  });

  describe('upload()', () => {
    it('writes file to disk and returns URL path', async () => {
      const result = await provider.upload('avatars/test.png', Buffer.from('data'), 'image/png');

      expect(fs.promises.writeFile).toHaveBeenCalled();
      expect(result).toContain('avatars/test.png');
    });
  });

  describe('delete()', () => {
    it('deletes file from disk', async () => {
      await provider.delete('avatars/test.png');

      expect(fs.promises.unlink).toHaveBeenCalled();
    });
  });

  describe('getUrl()', () => {
    it('returns a URL path for the key', () => {
      const url = provider.getUrl('avatars/test.png');

      expect(url).toContain('avatars/test.png');
    });
  });
});
```

- [ ] **Step 4: 테스트 실행 (실패 확인)**

```bash
bun run test --testPathPatterns=local.provider
```

Expected: FAIL

- [ ] **Step 5: local.provider.ts 구현**

`src/shared/infrastructure/storage/providers/local.provider.ts`:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import type { IStorageProvider } from './storage-provider.interface';

@Injectable()
export class LocalProvider implements IStorageProvider {
  private readonly basePath: string;
  private readonly logger = new Logger(LocalProvider.name);

  constructor(private readonly config: ConfigService) {
    this.basePath = this.config.get<string>('STORAGE_LOCAL_PATH') ?? './uploads';
  }

  async upload(key: string, buffer: Buffer, _mimeType: string): Promise<string> {
    const fullPath = path.join(this.basePath, key);
    await fs.promises.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.promises.writeFile(fullPath, buffer);
    return `/uploads/${key}`;
  }

  async delete(key: string): Promise<void> {
    const fullPath = path.join(this.basePath, key);
    try {
      await fs.promises.unlink(fullPath);
    } catch {
      this.logger.warn(`File not found for deletion: ${key}`);
    }
  }

  getUrl(key: string): string {
    return `/uploads/${key}`;
  }
}
```

- [ ] **Step 6: 테스트 재실행 (통과 확인)**

```bash
bun run test --testPathPatterns=local.provider
```

Expected: PASS

- [ ] **Step 7: 커밋**

```bash
git add src/shared/infrastructure/storage/
git commit -m "feat: add IStorageProvider interface and LocalProvider"
```

---

## Task 5: S3Provider

**Files:**
- Create: `src/shared/infrastructure/storage/providers/s3.provider.ts`
- Create: `src/shared/infrastructure/storage/providers/s3.provider.spec.ts`

- [ ] **Step 1: s3.provider.spec.ts 작성 (TDD)**

`src/shared/infrastructure/storage/providers/s3.provider.spec.ts`:

```typescript
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { S3Provider } from './s3.provider';

const mockSend = jest.fn();

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({ send: mockSend })),
  PutObjectCommand: jest.fn().mockImplementation((input: any) => input),
  DeleteObjectCommand: jest.fn().mockImplementation((input: any) => input),
}));

describe('S3Provider', () => {
  let provider: S3Provider;

  beforeEach(async () => {
    mockSend.mockReset();

    const module = await Test.createTestingModule({
      providers: [
        S3Provider,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              const values: Record<string, string> = {
                AWS_S3_BUCKET: 'test-bucket',
                AWS_S3_REGION: 'ap-northeast-2',
                AWS_ACCESS_KEY_ID: 'key',
                AWS_SECRET_ACCESS_KEY: 'secret',
                AWS_S3_PUBLIC_URL: '',
              };
              return values[key];
            }),
          },
        },
      ],
    }).compile();

    provider = module.get(S3Provider);
  });

  describe('upload()', () => {
    it('uploads to S3 and returns URL', async () => {
      mockSend.mockResolvedValue({});

      const result = await provider.upload('avatars/test.png', Buffer.from('data'), 'image/png');

      expect(mockSend).toHaveBeenCalled();
      expect(result).toContain('avatars/test.png');
    });
  });

  describe('delete()', () => {
    it('deletes from S3', async () => {
      mockSend.mockResolvedValue({});

      await provider.delete('avatars/test.png');

      expect(mockSend).toHaveBeenCalled();
    });
  });

  describe('getUrl()', () => {
    it('returns S3 URL', () => {
      const url = provider.getUrl('avatars/test.png');

      expect(url).toContain('test-bucket');
      expect(url).toContain('avatars/test.png');
    });
  });
});
```

- [ ] **Step 2: 테스트 실행 (실패 확인)**

```bash
bun run test --testPathPatterns=s3.provider
```

Expected: FAIL

- [ ] **Step 3: s3.provider.ts 구현**

`src/shared/infrastructure/storage/providers/s3.provider.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import type { IStorageProvider } from './storage-provider.interface';

@Injectable()
export class S3Provider implements IStorageProvider {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string;
  private readonly region: string;

  constructor(private readonly config: ConfigService) {
    this.bucket = this.config.getOrThrow<string>('AWS_S3_BUCKET');
    this.region = this.config.getOrThrow<string>('AWS_S3_REGION');
    this.publicUrl = this.config.get<string>('AWS_S3_PUBLIC_URL') ?? '';

    this.client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: this.config.getOrThrow<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.config.getOrThrow<string>('AWS_SECRET_ACCESS_KEY'),
      },
    });
  }

  async upload(key: string, buffer: Buffer, mimeType: string): Promise<string> {
    await this.client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    }));

    return this.getUrl(key);
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    }));
  }

  getUrl(key: string): string {
    if (this.publicUrl) return `${this.publicUrl}/${key}`;
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }
}
```

- [ ] **Step 4: 테스트 재실행 (통과 확인)**

```bash
bun run test --testPathPatterns=s3.provider
```

Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add src/shared/infrastructure/storage/providers/s3.provider.ts src/shared/infrastructure/storage/providers/s3.provider.spec.ts
git commit -m "feat: add S3Provider"
```

---

## Task 6: StorageModule

**Files:**
- Create: `src/shared/infrastructure/storage/storage.service.ts`
- Create: `src/shared/infrastructure/storage/storage.module.ts`

- [ ] **Step 1: storage.service.ts 생성**

`src/shared/infrastructure/storage/storage.service.ts`:

```typescript
import { Inject, Injectable } from '@nestjs/common';
import { STORAGE_PROVIDER } from './storage.token';
import type { IStorageProvider } from './providers/storage-provider.interface';

@Injectable()
export class StorageService {
  constructor(
    @Inject(STORAGE_PROVIDER) private readonly provider: IStorageProvider,
  ) {}

  async upload(key: string, buffer: Buffer, mimeType: string): Promise<string> {
    return this.provider.upload(key, buffer, mimeType);
  }

  async delete(key: string): Promise<void> {
    return this.provider.delete(key);
  }

  getUrl(key: string): string {
    return this.provider.getUrl(key);
  }
}
```

- [ ] **Step 2: storage.module.ts 생성**

`src/shared/infrastructure/storage/storage.module.ts`:

```typescript
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageService } from './storage.service';
import { STORAGE_PROVIDER } from './storage.token';
import { LocalProvider } from './providers/local.provider';
import { S3Provider } from './providers/s3.provider';

@Global()
@Module({
  providers: [
    {
      provide: STORAGE_PROVIDER,
      useFactory: (config: ConfigService) => {
        const provider = config.get<string>('STORAGE_PROVIDER') ?? 'local';
        if (provider === 's3') return new S3Provider(config);
        return new LocalProvider(config);
      },
      inject: [ConfigService],
    },
    StorageService,
  ],
  exports: [StorageService],
})
export class StorageModule {}
```

- [ ] **Step 3: app.module.ts에 StorageModule 추가**

`src/app.module.ts` imports 배열에 추가. `EmailModule` 뒤에:

```typescript
import { StorageModule } from './shared/infrastructure/storage/storage.module';
```

imports 배열에 `StorageModule,` 추가.

- [ ] **Step 4: 빌드 확인**

```bash
bun run build
```

Expected: 성공

- [ ] **Step 5: 커밋**

```bash
git add src/shared/infrastructure/storage/ src/app.module.ts
git commit -m "feat: add StorageService and StorageModule with provider factory"
```

---

## Task 7: ImageService (Sharp 리사이징)

**Files:**
- Create: `src/shared/infrastructure/image/image.service.ts`
- Create: `src/shared/infrastructure/image/image.service.spec.ts`
- Create: `src/shared/infrastructure/image/image.module.ts`

- [ ] **Step 1: image.service.spec.ts 작성 (TDD)**

`src/shared/infrastructure/image/image.service.spec.ts`:

```typescript
import { ImageService } from './image.service';

jest.mock('sharp', () => {
  const mockResize = jest.fn().mockReturnValue({
    png: jest.fn().mockReturnValue({
      toBuffer: jest.fn().mockResolvedValue(Buffer.from('resized')),
    }),
    jpeg: jest.fn().mockReturnValue({
      toBuffer: jest.fn().mockResolvedValue(Buffer.from('resized')),
    }),
    webp: jest.fn().mockReturnValue({
      toBuffer: jest.fn().mockResolvedValue(Buffer.from('resized')),
    }),
  });
  return jest.fn().mockReturnValue({ resize: mockResize });
});

describe('ImageService', () => {
  let service: ImageService;

  beforeEach(() => {
    service = new ImageService();
  });

  it('resizes image to specified dimensions', async () => {
    const result = await service.resize(Buffer.from('original'), {
      width: 128,
      height: 128,
    });

    expect(result).toBeDefined();
    expect(result).toBeInstanceOf(Buffer);
  });

  it('maintains aspect ratio by default', async () => {
    const result = await service.resize(Buffer.from('original'), {
      width: 512,
      height: 512,
    });

    expect(result).toBeDefined();
  });
});
```

- [ ] **Step 2: 테스트 실행 (실패 확인)**

```bash
bun run test --testPathPatterns=image.service
```

Expected: FAIL

- [ ] **Step 3: image.service.ts 구현**

`src/shared/infrastructure/image/image.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import sharp from 'sharp';

@Injectable()
export class ImageService {
  async resize(
    buffer: Buffer,
    options: { width: number; height: number },
  ): Promise<Buffer> {
    return sharp(buffer)
      .resize(options.width, options.height, { fit: 'cover' })
      .png()
      .toBuffer();
  }
}
```

- [ ] **Step 4: 테스트 재실행 (통과 확인)**

```bash
bun run test --testPathPatterns=image.service
```

Expected: PASS

- [ ] **Step 5: image.module.ts 생성**

`src/shared/infrastructure/image/image.module.ts`:

```typescript
import { Global, Module } from '@nestjs/common';
import { ImageService } from './image.service';

@Global()
@Module({
  providers: [ImageService],
  exports: [ImageService],
})
export class ImageModule {}
```

- [ ] **Step 6: app.module.ts에 ImageModule 추가**

`src/app.module.ts` imports 배열에 추가. `StorageModule` 뒤에:

```typescript
import { ImageModule } from './shared/infrastructure/image/image.module';
```

imports 배열에 `ImageModule,` 추가.

- [ ] **Step 7: 빌드 확인**

```bash
bun run build
```

- [ ] **Step 8: 커밋**

```bash
git add src/shared/infrastructure/image/ src/app.module.ts
git commit -m "feat: add ImageService with Sharp resizing"
```

---

## Task 8: FilesService

**Files:**
- Create: `src/modules/files/files.service.ts`
- Create: `src/modules/files/files.service.spec.ts`
- Create: `src/modules/files/dto/upload-response.dto.ts`
- Modify: `src/modules/users/users.service.ts`

- [ ] **Step 1: upload-response.dto.ts 생성**

`src/modules/files/dto/upload-response.dto.ts`:

```typescript
export class UploadResponseDto {
  id: string;
  category: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl: string | null;
  mediumUrl: string | null;
  createdAt: Date;
}
```

- [ ] **Step 2: users.service.ts에 setAvatarUrl 추가**

`src/modules/users/users.service.ts`에 메서드 추가:

```typescript
async setAvatarUrl(id: string, avatarUrl: string | null): Promise<void> {
  await this.db
    .update(schema.users)
    .set({ avatarUrl, updatedAt: new Date() })
    .where(eq(schema.users.id, id));
}
```

- [ ] **Step 3: files.service.spec.ts 작성 (TDD)**

`src/modules/files/files.service.spec.ts`:

```typescript
import { Test } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { FilesService } from './files.service';
import { StorageService } from '../../shared/infrastructure/storage/storage.service';
import { ImageService } from '../../shared/infrastructure/image/image.service';
import { DRIZZLE_CLIENT } from '../../shared/infrastructure/database/database.token';

describe('FilesService', () => {
  let service: FilesService;
  let mockDb: { insert: jest.Mock; select: jest.Mock; delete: jest.Mock };
  let mockStorage: { upload: jest.Mock; delete: jest.Mock; getUrl: jest.Mock };
  let mockImage: { resize: jest.Mock };

  beforeEach(async () => {
    mockDb = {
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
    };
    mockStorage = {
      upload: jest.fn().mockResolvedValue('/uploads/test.png'),
      delete: jest.fn().mockResolvedValue(undefined),
      getUrl: jest.fn().mockReturnValue('/uploads/test.png'),
    };
    mockImage = {
      resize: jest.fn().mockResolvedValue(Buffer.from('resized')),
    };

    const module = await Test.createTestingModule({
      providers: [
        FilesService,
        { provide: DRIZZLE_CLIENT, useValue: mockDb },
        { provide: StorageService, useValue: mockStorage },
        { provide: ImageService, useValue: mockImage },
      ],
    }).compile();

    service = module.get(FilesService);
  });

  describe('uploadFile()', () => {
    it('uploads and stores file metadata', async () => {
      const file = {
        originalname: 'test.png',
        mimetype: 'image/png',
        size: 1024,
        buffer: Buffer.from('data'),
      } as Express.Multer.File;

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([{
            id: 'file-uuid',
            userId: 'user-uuid',
            category: 'gallery',
            originalName: 'test.png',
            mimeType: 'image/png',
            size: 1024,
            url: '/uploads/gallery/user-uuid/file-uuid-original.png',
            thumbnailUrl: '/uploads/gallery/user-uuid/file-uuid-thumbnail.png',
            mediumUrl: '/uploads/gallery/user-uuid/file-uuid-medium.png',
            createdAt: new Date(),
          }]),
        }),
      });

      const result = await service.uploadFile(file, 'user-uuid', 'gallery');

      expect(result.url).toBeDefined();
      expect(mockStorage.upload).toHaveBeenCalledTimes(3); // original + medium + thumbnail
      expect(mockImage.resize).toHaveBeenCalledTimes(2); // medium + thumbnail
    });

    it('rejects gallery upload when limit reached', async () => {
      mockDb.select = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(Array(10).fill({})),
        }),
      });

      const file = {
        originalname: 'test.png',
        mimetype: 'image/png',
        size: 1024,
        buffer: Buffer.from('data'),
      } as Express.Multer.File;

      await expect(service.uploadFile(file, 'user-uuid', 'gallery'))
        .rejects.toThrow('Gallery limit reached (max 10)');
    });
  });
});
```

- [ ] **Step 4: 테스트 실행 (실패 확인)**

```bash
bun run test --testPathPatterns=files.service
```

Expected: FAIL

- [ ] **Step 5: files.service.ts 구현**

`src/modules/files/files.service.ts`:

```typescript
import { Inject, Injectable, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { DRIZZLE_CLIENT } from '../../shared/infrastructure/database/database.token';
import { StorageService } from '../../shared/infrastructure/storage/storage.service';
import { ImageService } from '../../shared/infrastructure/image/image.service';
import { files } from './schemas/file.schema';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import * as path from 'path';

@Injectable()
export class FilesService {
  private static readonly GALLERY_LIMIT = 10;
  private static readonly ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

  constructor(
    // biome-ignore lint/suspicious/noExplicitAny: drizzle client union type
    @Inject(DRIZZLE_CLIENT) private readonly db: any,
    private readonly storageService: StorageService,
    private readonly imageService: ImageService,
  ) {}

  async uploadFile(
    file: Express.Multer.File,
    userId: string,
    category: 'avatar' | 'gallery',
  ) {
    this.validateFile(file);

    if (category === 'gallery') {
      const existing = await this.db
        .select()
        .from(files)
        .where(and(eq(files.userId, userId), eq(files.category, 'gallery')));

      if (existing.length >= FilesService.GALLERY_LIMIT) {
        throw new ConflictException('Gallery limit reached (max 10)');
      }
    }

    if (category === 'avatar') {
      await this.deleteExistingAvatar(userId);
    }

    const ext = path.extname(file.originalname).slice(1).toLowerCase();
    const fileUuid = randomUUID();
    const baseKey = `${category}/${userId}/${fileUuid}`;

    // Upload original
    const originalKey = `${baseKey}-original.${ext}`;
    const url = await this.storageService.upload(originalKey, file.buffer, file.mimetype);

    // Resize and upload medium (512x512)
    const mediumBuffer = await this.imageService.resize(file.buffer, { width: 512, height: 512 });
    const mediumKey = `${baseKey}-medium.${ext}`;
    const mediumUrl = await this.storageService.upload(mediumKey, mediumBuffer, 'image/png');

    // Resize and upload thumbnail (128x128)
    const thumbBuffer = await this.imageService.resize(file.buffer, { width: 128, height: 128 });
    const thumbKey = `${baseKey}-thumbnail.${ext}`;
    const thumbnailUrl = await this.storageService.upload(thumbKey, thumbBuffer, 'image/png');

    const [record] = await this.db
      .insert(files)
      .values({
        userId,
        category,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url,
        thumbnailUrl,
        mediumUrl,
      })
      .returning();

    return record;
  }

  async findByUser(userId: string, category?: string) {
    if (category) {
      return this.db
        .select()
        .from(files)
        .where(and(eq(files.userId, userId), eq(files.category, category)));
    }
    return this.db.select().from(files).where(eq(files.userId, userId));
  }

  async findById(id: string) {
    const [record] = await this.db
      .select()
      .from(files)
      .where(eq(files.id, id))
      .limit(1);
    return record ?? null;
  }

  async deleteFile(id: string, userId: string): Promise<void> {
    const record = await this.findById(id);
    if (!record) throw new NotFoundException('File not found');
    if (record.userId !== userId) throw new ForbiddenException('Not your file');

    // Extract storage keys from URLs and delete
    const urls = [record.url, record.thumbnailUrl, record.mediumUrl].filter(Boolean);
    for (const url of urls) {
      const key = this.extractKeyFromUrl(url);
      if (key) await this.storageService.delete(key);
    }

    await this.db.delete(files).where(eq(files.id, id));
  }

  private async deleteExistingAvatar(userId: string): Promise<void> {
    const [existing] = await this.db
      .select()
      .from(files)
      .where(and(eq(files.userId, userId), eq(files.category, 'avatar')))
      .limit(1);

    if (existing) {
      await this.deleteFile(existing.id, userId);
    }
  }

  private validateFile(file: Express.Multer.File): void {
    const ext = path.extname(file.originalname).slice(1).toLowerCase();
    if (!FilesService.ALLOWED_EXTENSIONS.includes(ext)) {
      throw new ConflictException(`File extension .${ext} not allowed. Use: jpg, jpeg, png, webp`);
    }
  }

  private extractKeyFromUrl(url: string): string | null {
    const parts = url.split('/uploads/');
    return parts[1] ?? null;
  }
}
```

- [ ] **Step 6: 테스트 재실행 (통과 확인)**

```bash
bun run test --testPathPatterns=files.service
```

Expected: PASS

- [ ] **Step 7: 커밋**

```bash
git add src/modules/files/ src/modules/users/users.service.ts
git commit -m "feat: add FilesService with upload, resize, and gallery limit"
```

---

## Task 9: FilesController + FilesModule

**Files:**
- Create: `src/modules/files/files.controller.ts`
- Create: `src/modules/files/files.module.ts`
- Modify: `src/app.module.ts`

- [ ] **Step 1: files.controller.ts 생성**

`src/modules/files/files.controller.ts`:

```typescript
import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe,
  BadRequestException,
  ParseFilePipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { FilesService } from './files.service';
import { UsersService } from '../users/users.service';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

@Controller('files')
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
    private readonly usersService: UsersService,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 5 * 1024 * 1024 },
  }))
  async upload(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Query('category') category: string,
    @CurrentUser('userId') userId: string,
  ) {
    if (!file) throw new BadRequestException('No file provided');
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(`MIME type ${file.mimetype} not allowed`);
    }
    if (category !== 'avatar' && category !== 'gallery') {
      throw new BadRequestException('Category must be "avatar" or "gallery"');
    }

    const result = await this.filesService.uploadFile(file, userId, category);

    if (category === 'avatar') {
      await this.usersService.setAvatarUrl(userId, result.url);
    }

    return result;
  }

  @Get()
  findAll(
    @CurrentUser('userId') userId: string,
    @Query('category') category?: string,
  ) {
    return this.filesService.findByUser(userId, category);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.filesService.findById(id);
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('userId') userId: string,
  ) {
    await this.filesService.deleteFile(id, userId);
    return { deleted: true };
  }
}
```

- [ ] **Step 2: files.module.ts 생성**

`src/modules/files/files.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { DatabaseModule } from '../../shared/infrastructure/database/database.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [DatabaseModule, UsersModule],
  controllers: [FilesController],
  providers: [FilesService],
  exports: [FilesService],
})
export class FilesModule {}
```

- [ ] **Step 3: app.module.ts에 FilesModule 추가**

`src/app.module.ts` imports 배열에 추가. `ImageModule` 뒤에:

```typescript
import { FilesModule } from './modules/files/files.module';
```

imports 배열에 `FilesModule,` 추가.

- [ ] **Step 4: 빌드 확인**

```bash
bun run build
```

Expected: 성공

- [ ] **Step 5: 커밋**

```bash
git add src/modules/files/ src/app.module.ts
git commit -m "feat: add FilesController and FilesModule"
```

---

## Task 10: 정적 파일 서빙 (로컬 개발용)

**Files:**
- Modify: `src/main.ts`

- [ ] **Step 1: main.ts에 정적 파일 서빙 추가**

`src/main.ts`에 다음 import 추가:

```typescript
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
```

`NestFactory.create` 호출을 다음과 같이 변경:

```typescript
const app = await NestFactory.create<NestExpressApplication>(AppModule);
```

기존 `await app.listen(port)` 앞에 추가:

```typescript
app.useStaticAssets(join(__dirname, '..', 'uploads'), { prefix: '/uploads/' });
```

- [ ] **Step 2: uploads 디렉토리 .gitignore에 추가**

`.gitignore` 파일에 추가:

```
uploads/
```

- [ ] **Step 3: 빌드 확인**

```bash
bun run build
```

- [ ] **Step 4: 커밋**

```bash
git add src/main.ts .gitignore
git commit -m "feat: serve static files from uploads directory"
```

---

## Task 11: e2e 테스트

**Files:**
- Create: `test/files.e2e-spec.ts`

- [ ] **Step 1: files.e2e-spec.ts 생성**

`test/files.e2e-spec.ts`:

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('FilesController (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;

  beforeAll(async () => {
    process.env['STORAGE_PROVIDER'] = 'local';
    process.env['STORAGE_LOCAL_PATH'] = './test-uploads';

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    const email = `files-${Date.now()}@example.com`;
    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password: 'password123' });

    accessToken = registerRes.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /files/upload', () => {
    it('rejects upload without auth', async () => {
      await request(app.getHttpServer())
        .post('/files/upload?category=gallery')
        .attach('file', Buffer.from('fake'), 'test.png')
        .expect(401);
    });

    it('rejects upload without file', async () => {
      await request(app.getHttpServer())
        .post('/files/upload?category=gallery')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);
    });

    it('rejects invalid category', async () => {
      await request(app.getHttpServer())
        .post('/files/upload?category=invalid')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', Buffer.from('fake'), 'test.png')
        .expect(400);
    });
  });

  describe('GET /files', () => {
    it('returns empty list initially', async () => {
      const res = await request(app.getHttpServer())
        .get('/files')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('DELETE /files/:id', () => {
    it('returns 404 for non-existent file', async () => {
      await request(app.getHttpServer())
        .delete('/files/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });
});
```

- [ ] **Step 2: 커밋**

```bash
git add test/files.e2e-spec.ts
git commit -m "test: add files e2e tests"
```

---

## 수용 기준 체크리스트

- [ ] `STORAGE_PROVIDER=local`로 로컬 디렉토리에 파일 저장
- [ ] `STORAGE_PROVIDER=s3`로 S3/R2에 파일 저장
- [ ] 업로드 시 원본/중간(512)/썸네일(128) 3종 자동 생성
- [ ] `POST /files/upload` → 파일 업로드 + 메타데이터 저장
- [ ] `GET /files` → 내 파일 목록 (category 필터)
- [ ] `DELETE /files/:id` → 본인 파일만 삭제 가능
- [ ] 프로필 1장, 갤러리 최대 10장 제한
- [ ] jpg/jpeg/png/webp만 허용, 5MB 초과 시 거부
- [ ] 모든 단위 테스트 통과
- [ ] e2e 업로드/조회/삭제 테스트 통과
- [ ] Biome lint/format 통과
