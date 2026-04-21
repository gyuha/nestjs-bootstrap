# Phase 6 Background Job Queue Design

**Date:** 2026-04-21
**Status:** Approved
**Scope:** 이메일 발송 비동기 큐잉 + Bull Board 대시보드 (Phase 6)

---

## Goal

NestJS Bootstrap에 범용 잡 큐 시스템을 추가한다. BullMQ 기반으로 이메일 발송을 비동기 잡으로 전환하고, 실패 시 자동 재시도, 잡 이벤트 로깅, Bull Board 대시보드를 제공한다.

---

## Architecture

### 모듈 위치

- `QueueModule`(`src/shared/infrastructure/queue/`): `@Global()`로 선언, BullMQ Queue/Worker 관리
- `EmailProcessor`(`src/shared/infrastructure/email/email.processor.ts`): 이메일 잡 처리
- Bull Board 설정(`src/bootstrap/admin/bull-board.setup.ts`): 개발 환경 대시보드

### 파일 구조

```
# 새로 생성
src/shared/infrastructure/queue/
├── queue.module.ts
├── queue.service.ts
├── queue.token.ts
└── queue.interface.ts

src/shared/infrastructure/email/
└── email.processor.ts

src/bootstrap/admin/
└── bull-board.setup.ts

# 수정
src/modules/auth/auth.service.ts          ← emailService.send* → queueService.addJob
src/shared/infrastructure/email/email.module.ts  ← EmailProcessor 등록
src/app.module.ts                         ← QueueModule 추가
src/bootstrap/validation/env.schema.ts    ← BULL_BOARD_ENABLED 추가
src/main.ts                               ← Bull Board 설정 호출
```

---

## Interface Design

### QueueJob 타입

```typescript
interface EmailJobData {
  type: EmailJobType;
  to: string;
  token?: string;
  ip?: string;
  userAgent?: string;
}

type EmailJobType =
  | 'signup-confirmation'
  | 'welcome'
  | 'login-alert'
  | 'password-reset'
  | 'email-change'
  | 'subscription-confirm'
  | 'account-deactivation';
```

### QueueService

```typescript
class QueueService {
  addJob(queueName: string, data: unknown): Promise<void>;
}
```

### EmailProcessor

```typescript
@Processor('email')
class EmailProcessor extends WorkerProcessor {
  async process(job: Job<EmailJobData>): Promise<void>;
}
```

---

## Data Flow

```
AuthService.register()
  → queueService.addJob('email', { type: 'signup-confirmation', to, token })
    → BullMQ Queue (Redis)
      → EmailProcessor.process(job)
        → EmailService.sendSignupConfirmation(to, token)
          → IEmailProvider.send()
```

1. AuthService가 더 이상 직접 EmailService 호출하지 않음
2. QueueService가 BullMQ Queue에 잡을 추가
3. EmailProcessor가 잡을 꺼내 EmailService 호출
4. 실패 시 BullMQ가 자동 재시도

---

## Retry Policy

| 설정 | 값 |
|------|-----|
| 최대 재시도 | 3 |
| 백오프 타입 | 지수 (`exponential`) |
| 초기 지연 | 5초 (→ 5s → 25s → 125s) |

## Job Event Logging

| 이벤트 | 로그 레벨 |
|--------|-----------|
| `completed` | `debug` |
| `failed` (재시도 중) | `warn` |
| `failed` (최종) | `error` |

---

## Bull Board Dashboard

- 경로: `/admin/queues`
- 개발 환경(`NODE_ENV !== 'production'`)에서만 활성화
- 환경변수: `BULL_BOARD_ENABLED=true` (기본값: `true` in dev, `false` in prod)
- 대기/완료/실패 잍 실시간 조회

---

## Error Handling

| 상황 | 동작 |
|------|------|
| 이메일 발송 실패 | BullMQ 자동 재시도 (3회, 백오프) |
| 3회 모두 실패 | `failed` 이벤트 → Pino `error` 로깅. 잡은 큐에 남아 수동 재시도 가능 |
| Redis 연결 끊김 | BullMQ 자동 재연결 |
| 잡 데이터 손상 | 프로세서 try/catch → `error` 로깅 후 잡 실패 |

---

## Environment Variables

```env
BULL_BOARD_ENABLED=true    # 개발 환경만, 프로덕션은 false
# REDIS_URL은 이미 존재
```

---

## Testing Strategy

| 레이어 | 전략 |
|--------|------|
| `QueueService` 단위 | BullMQ `Queue` mock, `addJob` 호출 검증 |
| `EmailProcessor` 단위 | `EmailService` mock, 잡 타입별 올바른 `send*` 호출 검증 |
| `QueueModule` 통합 | BullMQ mock, 모듈 등록/프로세서 바인딩 검증 |
| `AuthService` 단위 | 기존 테스트에서 `emailService.send*` → `queueService.addJob` mock 교체 |

---

## Acceptance Criteria

- [ ] 이메일 발송이 모두 큐를 경유하여 비동기 처리
- [ ] 이메일 발송 실패 시 자동 재시도 (3회, 지수 백오프)
- [ ] 잡 성공/실패/재시도 이벤트가 Pino 로거에 기록
- [ ] Bull Board 대시보드가 `/admin/queues`에서 확인 가능 (dev only)
- [ ] AuthService에서 직접 EmailService 호출 제거, 모두 큐 경유
- [ ] 기존 API 엔드포인트 동작 변화 없음
- [ ] 모든 단위 테스트 통과
- [ ] Biome lint/format 통과

---

## Tech Stack (추가)

- `bullmq` — Redis 기반 잡 큐
- `@bull-board/api` + `@bull-board/nestjs` — 잡 대시보드
