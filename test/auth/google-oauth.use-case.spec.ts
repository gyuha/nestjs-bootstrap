import type { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { beforeEach, describe, expect, it } from "vitest";
import {
  GoogleLogin,
  type GoogleLoginInput,
} from "../../src/modules/auth/application/google-login.use-case";
import { InvalidAuthCredentialsError } from "../../src/modules/auth/application/auth.errors";
import { RefreshTokenService } from "../../src/modules/auth/application/refresh-token.service";
import { TokenService } from "../../src/modules/auth/application/token.service";
import type {
  AuthIdentityRepository,
  CreateAuthIdentityRepositoryInput,
} from "../../src/modules/auth/domain/auth-identity.repository";
import type { AuthIdentity } from "../../src/modules/auth/domain/auth-identity.types";
import { User } from "../../src/modules/users/domain/user.entity";
import type {
  CreateUserRepositoryInput,
  UserRepository,
} from "../../src/modules/users/domain/user.repository";

const accessTokenSecret = "test-access-secret-that-is-at-least-32-characters";

describe("GoogleLogin", () => {
  let users: InMemoryUserRepository;
  let identities: InMemoryAuthIdentityRepository;
  let useCase: GoogleLogin;

  beforeEach(() => {
    users = new InMemoryUserRepository();
    identities = new InMemoryAuthIdentityRepository();
    useCase = new GoogleLogin(
      users,
      identities,
      new RefreshTokenService(),
      new TokenService(new JwtService(), createConfigService()),
      createRefreshTokenRepository(),
      createConfigService(),
    );
  });

  it("logs in an existing Google identity", async () => {
    const user = await users.create({
      email: "google-user@example.com",
      displayName: "Google User",
    });
    await identities.create({
      userId: user.id,
      provider: "google",
      providerUserId: "google-sub-existing",
      emailVerified: true,
    });

    const response = await useCase.execute(
      googleProfile({ providerUserId: "google-sub-existing", email: "changed@example.com" }),
    );

    expect(response).toMatchObject({
      accessToken: expect.any(String),
      refreshToken: expect.any(String),
      user: {
        id: user.id,
        email: "google-user@example.com",
        displayName: "Google User",
      },
    });
    expect(users.all()).toHaveLength(1);
    expect(identities.all()).toHaveLength(1);
  });

  it("connects a verified Google email to an existing password user", async () => {
    const user = await users.create({
      email: "password-user@example.com",
      displayName: "Password User",
    });
    await identities.create({
      userId: user.id,
      provider: "password",
      providerUserId: "password-user@example.com",
      passwordHash: "hash",
      emailVerified: false,
    });

    const response = await useCase.execute(
      googleProfile({
        providerUserId: "google-sub-link",
        email: "PASSWORD-USER@example.com",
        emailVerified: true,
      }),
    );

    expect(response.user.id).toBe(user.id);
    expect(identities.all()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          userId: user.id,
          provider: "google",
          providerUserId: "google-sub-link",
          emailVerified: true,
        }),
      ]),
    );
  });

  it("does not auto-link an unverified Google email to an existing password user", async () => {
    const passwordUser = await users.create({
      email: "unverified-link@example.com",
      displayName: "Password User",
    });
    await identities.create({
      userId: passwordUser.id,
      provider: "password",
      providerUserId: "unverified-link@example.com",
      passwordHash: "hash",
      emailVerified: false,
    });

    await expect(
      useCase.execute(
        googleProfile({
          providerUserId: "google-sub-unverified",
          email: "unverified-link@example.com",
          emailVerified: false,
          displayName: "Google Profile",
        }),
      ),
    ).rejects.toBeInstanceOf(InvalidAuthCredentialsError);

    expect(users.all()).toHaveLength(1);
    expect(identities.findByUserAndProvider(passwordUser.id, "google")).resolves.toBeNull();
  });

  it("rejects a new unverified Google profile without creating a user or identity", async () => {
    await expect(
      useCase.execute(
        googleProfile({
          providerUserId: "google-sub-new-unverified",
          email: "new-unverified@example.com",
          emailVerified: false,
          displayName: "New Unverified",
        }),
      ),
    ).rejects.toBeInstanceOf(InvalidAuthCredentialsError);

    expect(users.all()).toHaveLength(0);
    expect(identities.all()).toHaveLength(0);
  });

  it("creates a user and Google identity for a new verified Google profile", async () => {
    const response = await useCase.execute(
      googleProfile({
        providerUserId: "google-sub-new",
        email: "new-google@example.com",
        emailVerified: true,
        displayName: "New Google",
        avatarUrl: "https://example.com/avatar.png",
      }),
    );

    expect(response).toMatchObject({
      accessToken: expect.any(String),
      refreshToken: expect.any(String),
      user: {
        email: "new-google@example.com",
        displayName: "New Google",
        avatarUrl: "https://example.com/avatar.png",
        role: "USER",
        status: "active",
      },
    });
    expect(users.all()).toHaveLength(1);
    expect(identities.all()).toEqual([
      expect.objectContaining({
        userId: response.user.id,
        provider: "google",
        providerUserId: "google-sub-new",
        emailVerified: true,
      }),
    ]);
  });
});

function googleProfile(overrides: Partial<GoogleLoginInput> = {}): GoogleLoginInput {
  return {
    providerUserId: "google-sub",
    email: "google@example.com",
    emailVerified: true,
    displayName: "Google User",
    avatarUrl: null,
    ...overrides,
  };
}

function createConfigService(): ConfigService {
  return {
    getOrThrow: (key: string) => {
      const values: Record<string, string> = {
        "auth.accessTokenExpiresIn": "15m",
        "auth.accessTokenSecret": accessTokenSecret,
        "auth.refreshTokenExpiresIn": "30d",
      };

      const value = values[key];

      if (!value) {
        throw new Error(`Missing config key: ${key}`);
      }

      return value;
    },
  } as ConfigService;
}

function createRefreshTokenRepository() {
  return {
    create: async (input: { userId: string; tokenHash: string; expiresAt: Date }) => ({
      id: `refresh-token-${input.userId}`,
      userId: input.userId,
      tokenHash: input.tokenHash,
      expiresAt: input.expiresAt,
      revokedAt: null,
      replacedByTokenId: null,
      userAgent: null,
      ipAddress: null,
      createdAt: new Date(),
    }),
  } as never;
}

class InMemoryUserRepository implements UserRepository {
  private readonly users: User[] = [];

  async create(input: CreateUserRepositoryInput): Promise<User> {
    const user = User.create(input);
    this.users.push(user);

    return user;
  }

  async findById(id: string): Promise<User | null> {
    return this.users.find((user) => user.id === id) ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.users.find((user) => user.email === email.toLowerCase()) ?? null;
  }

  async list(): Promise<never> {
    throw new Error("Not implemented in GoogleLogin tests");
  }

  async update(): Promise<never> {
    throw new Error("Not implemented in GoogleLogin tests");
  }

  all(): User[] {
    return this.users;
  }
}

class InMemoryAuthIdentityRepository
  implements Pick<AuthIdentityRepository, "create" | "findByProvider" | "findByUserAndProvider">
{
  private readonly identities: AuthIdentity[] = [];

  async create(input: CreateAuthIdentityRepositoryInput): Promise<AuthIdentity> {
    const identity = {
      id: `identity-${this.identities.length + 1}`,
      userId: input.userId,
      provider: input.provider,
      providerUserId: input.providerUserId,
      passwordHash: input.passwordHash ?? null,
      emailVerified: input.emailVerified ?? false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.identities.push(identity);

    return identity;
  }

  async findByProvider(
    provider: AuthIdentity["provider"],
    providerUserId: string,
  ): Promise<AuthIdentity | null> {
    return (
      this.identities.find(
        (identity) => identity.provider === provider && identity.providerUserId === providerUserId,
      ) ?? null
    );
  }

  async findByUserAndProvider(
    userId: string,
    provider: AuthIdentity["provider"],
  ): Promise<AuthIdentity | null> {
    return (
      this.identities.find(
        (identity) => identity.userId === userId && identity.provider === provider,
      ) ?? null
    );
  }

  all(): AuthIdentity[] {
    return this.identities;
  }
}
