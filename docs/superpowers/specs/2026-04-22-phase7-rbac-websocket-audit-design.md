# Phase 7 RBAC + WebSocket + Audit Log Design

**Date:** 2026-04-22
**Status:** Approved
**Scope:** 단순 Role 기반 접근 제어 + WebSocket 실시간 통신 + 핵심 보안 이벤트 감사 로그 (Phase 7)

---

## Goal

NestJS Bootstrap에 세 가지 크로스-커팅 인프라를 추가한다:

1. **RBAC** — `@Roles()` 데코레이터 + `RolesGuard`로 역할 기반 접근 제어
2. **WebSocket Gateway** — 서버→클라이언트 푸시, 양방향 인메모리 채팅, 토픽 구독
3. **Audit Log** — 핵심 보안 이벤트(로그인/로그아웃/비밀번호 변경/역할 변경) DB 기록

세 모듈은 `@nestjs/event-emitter`(EventEmitter2)를 내부 이벤트 버스로 사용해 느슨하게 통합된다.

---

## Architecture

### 이벤트 흐름

```
AuthService / UsersService
  → eventEmitter.emit('auth.login', payload)
  → eventEmitter.emit('auth.logout', payload)
  → eventEmitter.emit('auth.password-changed', payload)
  → eventEmitter.emit('user.role-changed', payload)
      ↓                          ↓
AuditListener               AppGateway
  → audit_logs DB 저장       → 해당 유저에게 실시간 푸시
```

### 폴더 구조

```
src/
├── modules/
│   └── chat/
│       ├── chat.gateway.ts
│       └── chat.module.ts
├── shared/
│   └── infrastructure/
│       ├── rbac/
│       │   ├── rbac.module.ts
│       │   ├── role.enum.ts
│       │   ├── roles.decorator.ts
│       │   └── roles.guard.ts
│       ├── gateway/
│       │   ├── app.gateway.ts
│       │   ├── gateway.module.ts
│       │   └── gateway.service.ts
│       └── audit/
│           ├── audit.module.ts
│           ├── audit.service.ts
│           ├── audit.listener.ts
│           └── audit-log.schema.ts

# 수정
src/modules/users/users.service.ts        ← updateRole() + 이벤트 발행
src/modules/auth/auth.service.ts          ← login/logout/resetPassword + 이벤트 발행
src/shared/infrastructure/database/schema/users.schema.ts  ← role 컬럼 추가
src/app.module.ts                         ← RbacModule, GatewayModule, AuditModule, EventEmitterModule 추가
```

---

## Section 1: RBAC

### Role Enum

```typescript
enum Role {
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  USER = 'user',
}
```

### DB 변경

`users` 테이블에 `role` 컬럼 추가:

```typescript
role: text('role').notNull().default('user')
```

Drizzle migration으로 반영.

### 데코레이터 & Guard

```typescript
// 사용 예시
@Roles(Role.ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
@Delete(':id')
deleteUser() { ... }
```

**RolesGuard 동작:**
1. `@Roles()` 데코레이터에서 필요 역할 읽기
2. JWT payload의 `user.role`과 비교
3. 불일치 시 `ForbiddenException` (403)
4. `@Roles()` 없으면 통과

### 역할 변경 이벤트

```typescript
// UsersService.updateRole()
await this.eventEmitter.emit('user.role-changed', {
  userId,
  oldRole,
  newRole,
  changedBy,
});
```

---

## Section 2: WebSocket Gateway

### 패키지

```
@nestjs/websockets
@nestjs/platform-socket.io
socket.io
```

### 연결 & 인증

- Socket.io 기반 NestJS Gateway
- 연결 시 `socket.handshake.auth.token` JWT 검증
- 미인증 연결 즉시 disconnect

### AppGateway (푸시 + 구독)

| 이벤트 | 방향 | 설명 |
|--------|------|------|
| `subscribe` | client→server | 토픽 구독 (socket.join) |
| `unsubscribe` | client→server | 구독 해제 (socket.leave) |
| `notification` | server→client | 개인 푸시 알림 |
| `event` | server→room | 토픽 구독자 전체 브로드캐스트 |

```typescript
// GatewayService — 다른 서비스에서 주입해 사용
gatewayService.sendToUser(userId, 'notification', payload);
gatewayService.sendToRoom(topic, 'event', payload);
```

### ChatGateway (양방향 인메모리)

| 이벤트 | 방향 | 설명 |
|--------|------|------|
| `chat.join` | client→server | 채팅방 참가 |
| `chat.leave` | client→server | 채팅방 퇴장 |
| `chat.message` | client→server | 메시지 전송 |
| `chat.message` | server→room | 방 전체에 브로드캐스트 |

메시지 DB 저장 없음. 연결 종료 시 소멸.

### 이벤트 → 푸시 연동

```typescript
@OnEvent('user.role-changed')
handleRoleChanged(payload) {
  this.gatewayService.sendToUser(payload.userId, 'role-changed', payload);
}
```

---

## Section 3: Audit Log

### DB 테이블 (`audit_logs`)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | uuid | PK |
| `userId` | uuid \| null | 행위자 (미인증 시 null) |
| `action` | text | 이벤트 식별자 |
| `ip` | text \| null | 요청 IP |
| `userAgent` | text \| null | 브라우저/클라이언트 |
| `metadata` | text (JSON) / jsonb \| null | 추가 컨텍스트 (SQLite: text, PostgreSQL: jsonb) |
| `createdAt` | timestamp | 발생 시각 |

### 기록 대상 이벤트

| 이벤트 | 트리거 위치 |
|--------|------------|
| `auth.login` | `AuthService.login()` |
| `auth.logout` | `AuthService.logout()` |
| `auth.password-changed` | `AuthService.resetPassword()` |
| `user.role-changed` | `UsersService.updateRole()` |

### AuditListener

```typescript
@OnEvent('auth.login')
async handleLogin({ userId, ip, userAgent }) {
  await this.auditService.log({ userId, action: 'auth.login', ip, userAgent });
}
```

감사 로그 조회 API는 이번 Phase 범위 밖. 로깅만 구현.

---

## Section 4: 패키지 추가

```
@nestjs/websockets
@nestjs/platform-socket.io
@nestjs/event-emitter
socket.io
```

추가 환경변수 없음 — 기존 Redis/DB 연결 재사용, WebSocket은 기존 HTTP 포트 공유.

---

## Testing Strategy

| 레이어 | 전략 |
|--------|------|
| `RolesGuard` | 역할 일치/불일치 케이스 단위 테스트 |
| `AuditService` | DB mock, `log()` 호출 검증 |
| `AuditListener` | EventEmitter 이벤트 → `auditService.log` 호출 검증 |
| `AppGateway` | Socket mock, 푸시/구독 동작 검증 |
| `ChatGateway` | join/leave/message 브로드캐스트 검증 |
| E2E | RBAC 보호 엔드포인트 403 응답 검증 |

---

## Implementation Order

1. `@nestjs/event-emitter` 설치 및 `EventEmitterModule` 등록
2. **RBAC** — `role.enum.ts`, `roles.decorator.ts`, `roles.guard.ts`, `RbacModule`, users 테이블 migration
3. **Audit Log** — `audit-log.schema.ts`, `AuditService`, `AuditListener`, `AuditModule`
4. **WebSocket** — `GatewayService`, `AppGateway`, `GatewayModule`
5. **Chat** — `ChatGateway`, `ChatModule`
6. **이벤트 발행 연결** — `AuthService`, `UsersService`에 `eventEmitter.emit` 추가
7. **테스트** — 각 모듈 단위 테스트 + E2E

---

## Acceptance Criteria

- [ ] `@Roles(Role.ADMIN)` + `RolesGuard`로 역할 보호 엔드포인트 동작
- [ ] 미인증 WebSocket 연결 즉시 disconnect
- [ ] 서버→클라이언트 개인 푸시 및 토픽 브로드캐스트 동작
- [ ] 채팅방 join/leave/message 브로드캐스트 동작
- [ ] 로그인/로그아웃/비밀번호 변경/역할 변경 시 `audit_logs` 레코드 생성
- [ ] 역할 변경 시 해당 유저에게 WebSocket 푸시
- [ ] 모든 단위 테스트 통과
- [ ] Biome lint/format 통과

---

## Tech Stack (추가)

- `@nestjs/websockets` + `@nestjs/platform-socket.io` — WebSocket Gateway
- `@nestjs/event-emitter` (EventEmitter2) — 내부 이벤트 버스
- `socket.io` — WebSocket 클라이언트/서버 프로토콜
