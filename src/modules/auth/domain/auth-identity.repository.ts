import type { AuthIdentity, AuthProvider } from "./auth-identity.types";

export const AUTH_IDENTITY_REPOSITORY = Symbol("AUTH_IDENTITY_REPOSITORY");

export type DuplicateAuthIdentityConflict = "providerIdentity" | "userProvider";

export class DuplicateAuthIdentityError extends Error {
  constructor(
    readonly conflict: DuplicateAuthIdentityConflict,
    message = "Auth identity already exists",
  ) {
    super(message);
    this.name = "DuplicateAuthIdentityError";
  }
}

export type CreateAuthIdentityRepositoryInput = {
  userId: string;
  provider: AuthProvider;
  providerUserId: string;
  passwordHash?: string | null;
  emailVerified?: boolean;
};

export interface AuthIdentityRepository {
  findByProvider(provider: AuthProvider, providerUserId: string): Promise<AuthIdentity | null>;
  findByUserAndProvider(userId: string, provider: AuthProvider): Promise<AuthIdentity | null>;
  create(input: CreateAuthIdentityRepositoryInput): Promise<AuthIdentity>;
}
