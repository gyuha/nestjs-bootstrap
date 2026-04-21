# Phase 4 Email Service Design

**Date:** 2026-04-21  
**Status:** Approved  
**Scope:** 트랜잭션 + 알림 + 마케팅 이메일 서비스 (Phase 4)

---

## Goal

NestJS Bootstrap에 이메일 발송 기능을 추가한다. Provider 추상화로 Resend/SMTP/Log를 런타임에 교체 가능하고, React Email 기반 TSX 템플릿으로 7종의 이메일을 지원한다. Phase 6(큐) 연동 시 `IEmailProvider.send()` 구현체만 교체하면 된다.

---

## Architecture

### 모듈 위치

`EmailModule`은 `src/shared/infrastructure/email/`에 위치하며 `@Global()`로 선언해 전체 앱에서 `EmailService`를 자유롭게 주입할 수 있다.

### Provider 추상화

`IEmailProvider` 인터페이스를 통해 실제 발송 구현체를 분리한다. 환경변수 `EMAIL_PROVIDER`로 런타임에 provider를 선택한다:

| 값 | 구현체 | 용도 |
|----|--------|------|
| `resend` | `ResendProvider` | 프로덕션 기본값 |
| `smtp` | `SmtpProvider` | 자체 서버 / SES SMTP |
| `log` | `LogProvider` | 로컬 개발 (콘솔 출력) |

### 파일 구조

```
src/shared/infrastructure/email/
├── email.module.ts
├── email.service.ts
├── email.token.ts
├── providers/
│   ├── email-provider.interface.ts
│   ├── resend.provider.ts
│   ├── smtp.provider.ts
│   └── log.provider.ts
└── templates/
    ├── base.layout.tsx
    ├── signup-confirmation.email.tsx
    ├── password-reset.email.tsx
    ├── email-change.email.tsx
    ├── login-alert.email.tsx
    ├── subscription-confirm.email.tsx
    ├── welcome.email.tsx
    └── account-deactivation.email.tsx
```

### 토큰 관리

이메일 확인/재설정 토큰은 Phase 2/3에서 구축한 Redis에 저장한다.

| 토큰 종류 | Redis 키 패턴 | TTL |
|-----------|--------------|-----|
| 이메일 확인 | `email:verify:{userId}` | 24시간 |
| 비밀번호 재설정 | `email:password-reset:{userId}` | 1시간 |
| 이메일 변경 확인 | `email:change:{userId}` | 24시간 |
| 마케팅 구독 확인 | `email:subscribe:{email}` | 48시간 |

---

## Interface Design

### IEmailProvider

```typescript
interface IEmailProvider {
  send(options: {
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
  }): Promise<void>;
}
```

### EmailService 공개 API

```typescript
// 트랜잭션
sendSignupConfirmation(to: string, token: string): Promise<void>
sendPasswordReset(to: string, token: string): Promise<void>
sendEmailChange(to: string, token: string): Promise<void>
sendLoginAlert(to: string, ip: string, userAgent: string): Promise<void>  // 매 로그인마다 발송

// 시스템
sendWelcome(to: string, name?: string): Promise<void>
sendAccountDeactivationWarning(to: string): Promise<void>

// 마케팅
sendSubscriptionConfirmation(to: string, token: string): Promise<void>
```

내부적으로 각 메서드는 React Email 템플릿을 렌더링(`@react-email/render`)한 후 `IEmailProvider.send()`를 호출한다.

### 데이터 흐름

```
AuthService.register()
  → EmailService.sendSignupConfirmation()
    → React Email 렌더링 → HTML 문자열
      → IEmailProvider.send()
        → Resend API / SMTP / console.log
```

---

## DB Schema 변경

기존 `users` 테이블에 다음 컬럼을 추가하는 마이그레이션이 필요하다:

```typescript
isEmailVerified: boolean('is_email_verified').notNull().default(false),
isMarketingSubscribed: boolean('is_marketing_subscribed').notNull().default(false),
```

- `GET /auth/verify-email` 성공 시 `isEmailVerified = true`로 업데이트
- `GET /auth/unsubscribe` 성공 시 `isMarketingSubscribed = false`로 업데이트
- `sendSubscriptionConfirmation` 성공 후 확인 시 `isMarketingSubscribed = true`로 업데이트

---

## New Auth Endpoints

기존 `AuthController`에 다음 엔드포인트를 추가한다:

| Method | Path | 설명 |
|--------|------|------|
| `GET` | `/auth/verify-email` | 이메일 확인 토큰 검증 (`?token=xxx`) |
| `POST` | `/auth/forgot-password` | 비밀번호 재설정 이메일 발송 |
| `POST` | `/auth/reset-password` | 토큰 + 새 비밀번호로 재설정 |
| `GET` | `/auth/verify-email-change` | 이메일 변경 확인 (`?token=xxx`) |
| `GET` | `/auth/unsubscribe` | 마케팅 수신 거부 (`?token=xxx`) |

---

## Error Handling

- **발송 실패**: `EmailDeliveryException` throw → 호출자가 catch해서 로그만 남김. 이메일 실패가 메인 비즈니스 플로우(회원가입 등)를 차단하지 않는다.
- **토큰 만료**: `UnauthorizedException` (401) 반환.
- **토큰 재사용**: Redis에서 토큰 삭제 후 두 번째 요청 시 `NotFoundException` (404) 반환.
- **Provider 미설정**: Zod 환경변수 스키마 검증으로 앱 시작 시 fail-fast.

---

## Environment Variables

```env
# 공통
EMAIL_PROVIDER=resend          # resend | smtp | log
EMAIL_FROM=noreply@example.com

# Resend
RESEND_API_KEY=re_xxx

# SMTP
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user
SMTP_PASS=pass
SMTP_SECURE=false              # true for port 465
```

---

## Testing Strategy

| 레이어 | 전략 |
|--------|------|
| `EmailService` 단위 | `IEmailProvider` mock, 각 메서드가 올바른 `to`/`subject`로 호출하는지 검증 |
| `ResendProvider` 단위 | Resend SDK mock |
| `SmtpProvider` 단위 | nodemailer mock |
| `LogProvider` 단위 | `console.log` spy |
| Auth 흐름 e2e | `EMAIL_PROVIDER=log`로 실제 발송 없이 토큰 발급/검증 전체 흐름 검증 |

---

## Tech Stack (추가)

- `resend` — Resend SDK
- `nodemailer` + `@types/nodemailer` — SMTP 발송
- `@react-email/render` — TSX → HTML 렌더링
- `@react-email/components` — 공통 UI 컴포넌트 (Button, Text 등)

---

## Acceptance Criteria

- [ ] `EMAIL_PROVIDER=resend`로 Resend를 통한 실제 발송
- [ ] `EMAIL_PROVIDER=smtp`로 SMTP 발송
- [ ] `EMAIL_PROVIDER=log`로 콘솔 출력 (발송 없음)
- [ ] 7종 이메일 템플릿 모두 React Email TSX로 구현
- [ ] `POST /auth/forgot-password` → 1시간 유효 토큰 이메일 발송
- [ ] `POST /auth/reset-password` → 토큰 검증 후 비밀번호 변경, 토큰 삭제
- [ ] `GET /auth/verify-email` → 24시간 유효 토큰 검증
- [ ] 이메일 발송 실패 시 메인 플로우 차단 없음
- [ ] 모든 단위 테스트 통과
- [ ] e2e 토큰 흐름 테스트 통과
- [ ] Biome lint/format 통과
