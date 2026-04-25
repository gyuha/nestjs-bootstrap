import { randomUUID } from "node:crypto";
import type { AuthIdentity } from "../../src/modules/auth/domain/auth-identity.types";
import type {
  CreateRefreshTokenRepositoryInput,
  RefreshToken,
} from "../../src/modules/auth/domain/refresh-token.repository";
import type {
  authIdentities,
  refreshTokens,
} from "../../src/shared/infrastructure/database/schema";

type AuthIdentityInsert = typeof authIdentities.$inferInsert;
type RefreshTokenInsert = typeof refreshTokens.$inferInsert;

let authSequence = 0;

export type PasswordIdentityFactoryInput = Partial<AuthIdentity> & {
  email?: string;
};

export function buildPasswordIdentity(input: PasswordIdentityFactoryInput = {}): AuthIdentity {
  const sequence = nextAuthSequence();
  const now = new Date("2026-01-01T00:00:00.000Z");
  const providerUserId = input.providerUserId ?? input.email ?? `user-${sequence}@example.com`;

  return {
    id: input.id ?? randomUUID(),
    userId: input.userId ?? randomUUID(),
    provider: "password",
    providerUserId,
    passwordHash: input.passwordHash ?? "argon2id-test-password-hash",
    emailVerified: input.emailVerified ?? false,
    createdAt: input.createdAt ?? now,
    updatedAt: input.updatedAt ?? now,
  };
}

export function buildPasswordIdentityInsert(
  input: PasswordIdentityFactoryInput = {},
): AuthIdentityInsert {
  const identity = buildPasswordIdentity(input);

  return {
    id: identity.id,
    userId: identity.userId,
    provider: identity.provider,
    providerUserId: identity.providerUserId,
    passwordHash: identity.passwordHash,
    emailVerified: identity.emailVerified,
    createdAt: identity.createdAt,
    updatedAt: identity.updatedAt,
  };
}

export type RefreshTokenFactoryInput = Partial<RefreshToken>;

export function buildRefreshToken(input: RefreshTokenFactoryInput = {}): RefreshToken {
  const sequence = nextAuthSequence();

  return {
    id: input.id ?? randomUUID(),
    userId: input.userId ?? randomUUID(),
    tokenHash: input.tokenHash ?? `refresh-token-hash-${sequence}`,
    expiresAt: input.expiresAt ?? new Date("2026-02-01T00:00:00.000Z"),
    revokedAt: input.revokedAt ?? null,
    replacedByTokenId: input.replacedByTokenId ?? null,
    userAgent: input.userAgent ?? "Vitest",
    ipAddress: input.ipAddress ?? "127.0.0.1",
    createdAt: input.createdAt ?? new Date("2026-01-01T00:00:00.000Z"),
  };
}

export function buildCreateRefreshTokenRepositoryInput(
  input: Partial<CreateRefreshTokenRepositoryInput> = {},
): CreateRefreshTokenRepositoryInput {
  const token = buildRefreshToken(input);

  return {
    userId: token.userId,
    tokenHash: token.tokenHash,
    expiresAt: token.expiresAt,
    userAgent: token.userAgent,
    ipAddress: token.ipAddress,
  };
}

export function buildRefreshTokenInsert(input: RefreshTokenFactoryInput = {}): RefreshTokenInsert {
  const token = buildRefreshToken(input);

  return {
    id: token.id,
    userId: token.userId,
    tokenHash: token.tokenHash,
    expiresAt: token.expiresAt,
    revokedAt: token.revokedAt,
    replacedByTokenId: token.replacedByTokenId,
    userAgent: token.userAgent,
    ipAddress: token.ipAddress,
    createdAt: token.createdAt,
  };
}

function nextAuthSequence(): number {
  authSequence += 1;
  return authSequence;
}
