# Phase 5 File Upload/Storage Design

**Date:** 2026-04-21
**Status:** Approved
**Scope:** 사용자 프로필 이미지 + 갤러리 파일 업로드/스토리지 (Phase 5)

---

## Goal

NestJS Bootstrap에 파일 업로드 기능을 추가한다. Storage provider 추상화로 Local/S3(Cloudflare R2 호환)를 런타임에 교체 가능하고, Sharp 기반으로 원본/중간/썸네일 3종 사이즈를 자동 생성한다. 프로필 아바타 1장 + 갤러리 최대 10장을 지원한다.

---

## Architecture

### 모듈 위치

- `StorageModule`(`src/shared/infrastructure/storage/`): `@Global()`로 선언, `IStorageProvider` 전략 패턴
- `ImageModule`(`src/shared/infrastructure/image/`): Sharp 리사이징 서비스
- `FilesModule`(`src/modules/files/`): 파일 메타데이터 CRUD, 업로드/조회/삭제 엔드포인트

### Storage Provider 추상화

`IStorageProvider` 인터페이스로 실제 스토리지 구현체를 분리한다. 환경변수 `STORAGE_PROVIDER`로 런타임에 선택한다:

| 값 | 구현체 | 용도 |
|----|--------|------|
| `local` | `LocalProvider` | 개발 환경 (`uploads/` 디렉토리) |
| `s3` | `S3Provider` | 프로덕션 (AWS S3 / Cloudflare R2) |

### 파일 구조

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
└── dto/
    └── upload-response.dto.ts

src/modules/files/schemas/
└── file.schema.ts

# 수정
src/modules/users/schemas/user.schema.ts   ← avatarUrl 컬럼 추가
src/modules/users/users.service.ts         ← setAvatarUrl 메서드 추가
src/modules/users/users.controller.ts      ← GET /users/me/avatar 추가
src/app.module.ts                          ← StorageModule, ImageModule, FilesModule 추가
```

### DB 스키마

```typescript
// src/modules/files/schemas/file.schema.ts
export const files = pgTable('files', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  category: text('category').notNull(),           // 'avatar' | 'gallery'
  originalName: text('original_name').notNull(),
  mimeType: text('mime_type').notNull(),
  size: integer('size').notNull(),                // bytes
  url: text('url').notNull(),                     // 원본 URL
  thumbnailUrl: text('thumbnail_url'),            // 128x128
  mediumUrl: text('medium_url'),                  // 512x512
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
```

`users` 테이블에 `avatarUrl` 컬럼 추가:

```typescript
avatarUrl: text('avatar_url'),   // 사용자 프로필 아바타 URL
```

---

## Interface Design

### IStorageProvider

```typescript
interface IStorageProvider {
  upload(key: string, buffer: Buffer, mimeType: string): Promise<string>;
  delete(key: string): Promise<void>;
  getUrl(key: string): string;
}
```

### ImageService

```typescript
class ImageService {
  resize(buffer: Buffer, options: { width: number; height: number }): Promise<Buffer>;
}
```

### FilesService 공개 API

```typescript
uploadFile(file: Express.Multer.File, userId: string, category: 'avatar' | 'gallery'): Promise<FileRecord>
findByUser(userId: string, category?: string): Promise<FileRecord[]>
findById(id: string): Promise<FileRecord | null>
deleteFile(id: string, userId: string): Promise<void>
```

### 데이터 흐름

```
POST /files/upload (multipart/form-data)
  → Multer (메모리에 파일 로드, 5MB 제한)
    → FileValidationPipe (확장자 검증: jpg/jpeg/png/webp)
      → ImageService.resize (썸네일 128x128 + 중간 512x512)
        → IStorageProvider.upload (원본/썸네일/중간 → 스토리지)
          → FilesService.create (DB 메타데이터 저장)
            → FileRecord 반환
```

---

## Endpoints

| Method | Path | Auth | 설명 |
|--------|------|------|------|
| `POST` | `/files/upload` | JWT | 파일 업로드 (multipart, `category` 필드) |
| `GET` | `/files` | JWT | 내 파일 목록 (`?category=avatar\|gallery`) |
| `GET` | `/files/:id` | JWT | 파일 상세 |
| `DELETE` | `/files/:id` | JWT | 파일 삭제 (본인 파일만) |
| `POST` | `/users/me/avatar` | JWT | 프로필 이미지 설정 (기존 아바타 교체) |

---

## Business Rules

- **프로필(avatar)**: 사용자당 1장, 새 업로드 시 기존 파일 + 스토리지 객체 삭제 후 교체
- **갤러리(gallery)**: 사용자당 최대 10장, 초과 시 409 Conflict
- **허용 확장자**: jpg, jpeg, png, webp
- **최대 파일 크기**: 5MB
- **리사이징 정책**:

| 사이즈 | 픽셀 | 용도 |
|--------|------|------|
| 원본 | 그대로 | 다운로드/확대 |
| 중간 | 512x512 | 목록/카드 |
| 썸네일 | 128x128 | 아바타/미리보기 |

- **스토리지 키**: `{category}/{userId}/{uuid}-{size}.{ext}`

---

## Error Handling

| 상황 | 응답 |
|------|------|
| 파일 크기 초과 (5MB) | 413 Payload Too Large |
| 허용되지 않은 확장자 | 400 Bad Request |
| 갤러리 한도 초과 (10장) | 409 Conflict |
| 다른 사용자 파일 삭제 | 403 Forbidden |
| 스토리지 업로드 실패 | 500 + 로그 |
| 파일 없음 | 404 Not Found |

---

## Environment Variables

```env
# 공통
STORAGE_PROVIDER=local              # local | s3
STORAGE_LOCAL_PATH=./uploads        # 로컬 스토리지 경로

# S3 / R2
AWS_S3_BUCKET=my-bucket
AWS_S3_REGION=ap-northeast-2
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_PUBLIC_URL=                  # CloudFront URL (선택)
```

---

## Testing Strategy

| 레이어 | 전략 |
|--------|------|
| `LocalProvider` 단위 | `fs` mock, 파일 쓰기/삭제 검증 |
| `S3Provider` 단위 | `@aws-sdk/client-s3` mock |
| `ImageService` 단위 | Sharp mock, 리사이징 출력 검증 |
| `FilesService` 단위 | DB mock, 한도/권한 검증 |
| Files e2e | `STORAGE_PROVIDER=local`로 업로드/조회/삭제 전체 흐름 |

---

## Tech Stack (추가)

- `@aws-sdk/client-s3` — S3/R2 SDK (v3)
- `sharp` + `@types/sharp` — 이미지 리사이징
- `multer` + `@types/multer` — 파일 업로드 (express에 포함)

---

## Acceptance Criteria

- [ ] `STORAGE_PROVIDER=local`로 로컬 디렉토리에 파일 저장
- [ ] `STORAGE_PROVIDER=s3`로 S3/R2에 파일 저장
- [ ] 업로드 시 원본/중간(512)/썸네일(128) 3종 자동 생성
- [ ] `POST /files/upload` → 파일 업로드 + 메타데이터 저장
- [ ] `GET /files` → 내 파일 목록 (category 필터)
- [ ] `DELETE /files/:id` → 본인 파일만 삭제 가능
- [ ] `POST /users/me/avatar` → 기존 아바타 교체
- [ ] 프로필 1장, 갤러리 최대 10장 제한
- [ ] jpg/jpeg/png/webp만 허용, 5MB 초과 시 거부
- [ ] 모든 단위 테스트 통과
- [ ] e2e 업로드/조회/삭제 테스트 통과
- [ ] Biome lint/format 통과
