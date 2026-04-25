# NestJS DDD Bootstrap Project 설계 문서

**문서 작성일**: 2026-04-25  
**버전**: 1.0  
**상태**: 승인됨

---

## 1. 프로젝트 개요

NestJS DDD Bootstrap Project는 도메인 주도 개발(DDD) 기반의 모듈러 모놀리식 백엔드 시작점이다. 실무형 인증, 사용자 관리, 데이터베이스 연동, 테스트, 배포를 기본 구성으로 제공하여 새로운 도메인 모듈을 빠르게 추가할 수 있는 확장성 있는 구조를 목표로 한다.

---

## 2. 아키텍처

### 2.1 폴더 구조

```
src/
├── bootstrap/           # 앱 초기화 (swagger, validation, security, logging)
│   ├── swagger/
│   ├── validation/
│   ├── security/
│   └── logging/
├── shared/              # 공통 유틸 (domain, application, infrastructure, presentation)
│   ├── domain/
│   ├── application/
│   ├── infrastructure/
│   └── presentation/
├── modules/
│   ├── auth/           # 인증 모듈
│   │   ├── domain/
│   │   ├── application/
│   │   ├── infrastructure/
│   │   └── presentation/
│   └── users/          # 사용자 모듈
│       ├── domain/
│       ├── application/
│       ├── infrastructure/
│       └── presentation/
└── app.module.ts
```

### 2.2 설계 원칙

- 각 모듈은 독립적으로 확장 가능
- Domain → Application → Infrastructure → Presentation 계층 분리
- Repository pattern으로 DB 구현 분리
- 공통 기능은 `shared` 영역으로 모아 재사용

---

## 3. 인증 설계

### 3.1 지원 인증 방식

| 방식 | Provider | 설명 |
|------|----------|------|
| OAuth 2.0 | Google, GitHub, Kakao | 소셜 로그인 |
| 로컬 인증 | 이메일/비밀번호 | JWT 기반 |

### 3.2 Token 구조

| Token | 저장소 | TTL | 설명 |
|-------|--------|-----|------|
| Access Token | 메모리 (in-memory) | 15분 | JWT, Authorization Header |
| Refresh Token | DB + Redis | 7일 | Rotation 기반 재발급 |

### 3.3 Refresh Token 흐름

```
1. 사용자가 로그인
2. Access Token + Refresh Token 발급
3. Refresh Token: DB에 영속 저장, Redis에 키 등록
4. Access Token 만료 시 Refresh Token으로 재발급 요청
5. Redis黑了목록 확인 → DB 검증 → 새 Access Token 발급
6. 재발급 시 기존 Refresh Token을 revocation하고 새 Refresh Token 발급
```

### 3.4 RBAC 역할 체계

| Role | 권한 |
|------|------|
| USER | 기본 읽기/쓰기 (본인 데이터만) |
| ADMIN | 전체 접근 가능 |

---

## 4. 데이터 저장소 설계

### 4.1 저장소 전략

| 저장소 | 용도 | Driver |
|--------|------|--------|
| PostgreSQL | 운영 DB | Drizzle ORM |
| SQLite | 개발/테스트용 | Drizzle ORM |
| Redis | Refresh Token黑了목록, Session cache | ioredis |

### 4.2 주요 테이블

**users**
- id (UUID, PK)
- email (unique)
- password_hash (nullable, 소셜 로그인 시 null)
- name
- status (active/inactive)
- role (USER/ADMIN)
- created_at, updated_at

**oauth_accounts**
- id (UUID, PK)
- user_id (FK → users)
- provider (google/github/kakao)
- provider_user_id
- created_at

**refresh_tokens**
- id (UUID, PK)
- user_id (FK → users)
- token_hash
- expires_at
- revoked_at (nullable)
- created_at

---

## 5. Migration 정책

| 환경 | Policy | 명령어 |
|------|--------|--------|
| development | 자동 실행 | 앱 시작 시 자동 |
| test | 자동 실행 (bootstrap) | Jest setup |
| production | 수동 실행 | `npm run migration:run` |

---

## 6. Phase 구현 계획

### Phase 1: Foundation
- NestJS latest + TypeScript latest + Bun
- Biome (formatting, linting)
- Swagger / OpenAPI
- Config validation (class-validator, zod)
- API versioning
- Docker 기본 구성

### Phase 2: Data & Infrastructure
- Drizzle ORM 설정 (PostgreSQL, SQLite)
- Migration 체계 (Drizzle Kit)
- Repository abstraction
- Factory / Seeder 체계
- Redis 연동
- Health check endpoint
- docker-compose (app, postgres, redis)

### Phase 3: Auth Module
- OAuth 2.0 전략 (Google, GitHub, Kakao)
- JWT Access Token 발급/검증
- Refresh Token 발급/재발급/revocation
- RBAC Guard (USER, ADMIN)
- Auth DTO, Swagger 문서

### Phase 4: Users Module
- Users CRUD API
- 프로필 조회/수정
- 사용자 상태 관리 (active/inactive)
- 역할 관리 (USER/ADMIN)
- 테스트 및 문서

### Phase 5: Quality & Delivery
- Unit test 유틸 (mock factory, fixture helpers)
- e2e test 유틸 (test DB bootstrap)
- Husky pre-push (lint, format, test)
- Commitlint + Conventional Commits
- Dockerfile multi-stage build
- Startup migration support

---

## 7. 오픈 이슈 결론

| 이슈 | 결정 |
|------|------|
| OAuth 공급자 | Google + GitHub + Kakao + 이메일/비밀번호 |
| Refresh token 저장 | DB + Redis 혼합 (DB 영속, Redis黑了목록) |
| RBAC 역할 | USER / ADMIN 2단계 |
| Startup migration | development/test: 자동, production: 수동 |

---

## 8. 기술 스택

| 분류 | 기술 |
|------|------|
| Framework | NestJS latest |
| Language | TypeScript latest |
| Runtime | Bun |
| ORM | Drizzle ORM |
| Database | PostgreSQL (운영), SQLite (개발/테스트) |
| Cache | Redis |
| Auth | JWT (jsonwebtoken), Passport |
| API Docs | Swagger / OpenAPI |
| Code Quality | Biome, Husky, Commitlint |
| Container | Docker, docker-compose |

---

## 9. 향후 확장 방향

- 추가 도메인 모듈 (product, billing, notification)
- 감사 로그 및 운영 관측성 강화
- 권한 정책 세분화 (PBAC/ABAC)
- 비동기 이벤트 처리 및 메시징 확장
