# 설계 문서: src/ 전체 JSDoc/TSDoc 한국어 주석 추가

**작성일:** 2026-04-23  
**상태:** 승인됨

---

## 목표

`src/` 경로 아래의 모든 TypeScript 파일(소스 파일 + `*.spec.ts` 테스트 파일)에 한국어 JSDoc/TSDoc 주석을 추가하여 코드 이해도를 높인다.

---

## 에이전트 분담 구조

4개의 병렬 에이전트와 직접 처리 파일로 나눈다. 각 에이전트는 독립된 파일 집합을 담당하므로 충돌이 없다.

| 에이전트 | 담당 경로 | 파일 수 |
|---|---|---|
| Agent 1 | `src/bootstrap/` | ~16개 |
| Agent 2 | `src/shared/infrastructure/` | ~22개 |
| Agent 3 | `src/shared/utils/`, `src/shared/presentation/`, `src/shared/decorators/`, `src/shared/dto/` | ~22개 |
| Agent 4 | `src/modules/` | ~38개 |
| 직접 처리 | `src/main.ts`, `src/app.module.ts` | 2개 |

---

## JSDoc/TSDoc 주석 규칙

모든 에이전트가 동일한 규칙을 따른다.

### 클래스

```ts
/** 클래스가 하는 일을 한 줄로 요약 */
@Injectable()
export class AuthService { ... }
```

### 메서드 (public)

```ts
/** 액세스 토큰과 리프레시 토큰을 생성하여 반환한다.
 * @param user 토큰을 발급할 사용자 정보
 * @returns 서명된 JWT 액세스/리프레시 토큰 쌍
 */
async login(user: User): Promise<TokenPair> { ... }
```

### DTO 클래스 및 필드

```ts
/** 사용자 로그인 요청 DTO */
export class LoginDto {
  /** 가입 시 등록한 이메일 주소 */
  email: string;
}
```

### 인터페이스 / 타입

```ts
/** 스토리지 제공자가 구현해야 하는 인터페이스 */
export interface StorageProvider { ... }
```

### 데코레이터

```ts
/** 현재 요청에 인증된 사용자 객체를 파라미터로 주입하는 데코레이터 */
export const CurrentUser = createParamDecorator(...);
```

### spec 파일

```ts
/** AuthService의 단위 테스트 스위트 */
describe('AuthService', () => {
  /** 유효한 자격증명으로 로그인 시 토큰을 반환해야 한다 */
  it('should return tokens on valid credentials', ...);
});
```

---

## 주석을 달지 않는 경우

- import 구문
- 단순 getter/setter (예: `get name() { return this._name; }`)
- NestJS 데코레이터 파라미터 내부 문자열 (`@Module({ imports: [...] })` 등)
- constructor 주입 파라미터 (타입으로 역할이 명확한 경우)

---

## 성공 기준

- `src/` 아래 모든 파일에서 클래스, public 메서드, 인터페이스, DTO 필드, 데코레이터에 JSDoc 주석이 존재한다.
- 주석은 한국어로 작성되며, 파라미터가 있는 메서드에는 `@param`, 값을 반환하는 메서드에는 `@returns` 태그를 포함한다. `void` 메서드는 `@returns` 생략.
- `bun run lint` 및 `bun run test`가 주석 추가 후에도 통과한다.
