import { randomUUID } from "node:crypto";
import { type CreateUserInput, User } from "../../src/modules/users/domain/user.entity";
import type { CreateUserRepositoryInput } from "../../src/modules/users/domain/user.repository";
import type { UserRole, UserStatus } from "../../src/modules/users/domain/user.types";
import type { users } from "../../src/shared/infrastructure/database/schema";

type UserInsert = typeof users.$inferInsert;

let userSequence = 0;

export type UserFactoryInput = Partial<CreateUserInput> & {
  emailPrefix?: string;
};

export function buildUserInput(input: UserFactoryInput = {}): CreateUserInput {
  const sequence = nextUserSequence();
  const now = new Date("2026-01-01T00:00:00.000Z");

  return {
    id: input.id ?? randomUUID(),
    email: input.email ?? `${input.emailPrefix ?? "user"}-${sequence}@example.com`,
    displayName: input.displayName ?? `Test User ${sequence}`,
    avatarUrl: input.avatarUrl ?? null,
    bio: input.bio ?? null,
    role: input.role ?? "USER",
    status: input.status ?? "active",
    createdAt: input.createdAt ?? now,
    updatedAt: input.updatedAt ?? now,
  };
}

export function buildUser(input: UserFactoryInput = {}): User {
  return User.create(buildUserInput(input));
}

export function buildAdminUser(input: UserFactoryInput = {}): User {
  return buildUser({ ...input, role: "ADMIN" });
}

export function buildCreateUserRepositoryInput(
  input: Partial<CreateUserRepositoryInput> & { emailPrefix?: string } = {},
): CreateUserRepositoryInput {
  const user = buildUserInput(input);

  return {
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    role: user.role,
    status: user.status,
  };
}

export function buildUserInsert(input: UserFactoryInput = {}): UserInsert {
  const user = buildUserInput(input);

  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    role: user.role as UserRole,
    status: user.status as UserStatus,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function nextUserSequence(): number {
  userSequence += 1;
  return userSequence;
}
