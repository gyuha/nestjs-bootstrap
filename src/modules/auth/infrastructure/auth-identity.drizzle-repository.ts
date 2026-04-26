import { and, eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { authIdentities, type schema } from "../../../shared/infrastructure/database/schema";
import type {
  AuthIdentityRepository,
  CreateAuthIdentityRepositoryInput,
  DuplicateAuthIdentityConflict,
} from "../domain/auth-identity.repository";
import { DuplicateAuthIdentityError } from "../domain/auth-identity.repository";
import type { AuthIdentity, AuthProvider } from "../domain/auth-identity.types";

type Database = NodePgDatabase<typeof schema>;
type AuthIdentityRow = typeof authIdentities.$inferSelect;

export class DrizzleAuthIdentityRepository implements AuthIdentityRepository {
  constructor(private readonly db: Database) {}

  async findByProvider(
    provider: AuthProvider,
    providerUserId: string,
  ): Promise<AuthIdentity | null> {
    const [row] = await this.db
      .select()
      .from(authIdentities)
      .where(
        and(
          eq(authIdentities.provider, provider),
          eq(authIdentities.providerUserId, providerUserId),
        ),
      )
      .limit(1);

    return row ? this.toDomain(row) : null;
  }

  async findByUserAndProvider(
    userId: string,
    provider: AuthProvider,
  ): Promise<AuthIdentity | null> {
    const [row] = await this.db
      .select()
      .from(authIdentities)
      .where(and(eq(authIdentities.userId, userId), eq(authIdentities.provider, provider)))
      .limit(1);

    return row ? this.toDomain(row) : null;
  }

  async create(input: CreateAuthIdentityRepositoryInput): Promise<AuthIdentity> {
    const [row] = await this.insert(input);

    return this.toDomain(row);
  }

  private async insert(input: CreateAuthIdentityRepositoryInput) {
    try {
      return await this.db
        .insert(authIdentities)
        .values({
          userId: input.userId,
          provider: input.provider,
          providerUserId: input.providerUserId,
          passwordHash: input.passwordHash,
          emailVerified: input.emailVerified,
        })
        .returning();
    } catch (error) {
      const conflict = this.getDuplicateConflict(error);

      if (conflict) {
        throw new DuplicateAuthIdentityError(conflict);
      }

      throw error;
    }
  }

  private getDuplicateConflict(error: unknown): DuplicateAuthIdentityConflict | null {
    const cause = this.getErrorCause(error);

    if (cause?.code !== "23505") {
      return null;
    }

    if (cause.constraint === "auth_identities_provider_provider_user_id_unique") {
      return "providerIdentity";
    }

    if (cause.constraint === "auth_identities_user_id_provider_unique") {
      return "userProvider";
    }

    return null;
  }

  private getErrorCause(error: unknown): { code?: string; constraint?: string } | null {
    if (!error || typeof error !== "object" || !("cause" in error)) {
      return null;
    }

    const cause = error.cause;

    if (!cause || typeof cause !== "object") {
      return null;
    }

    return cause;
  }

  private toDomain(row: AuthIdentityRow): AuthIdentity {
    return {
      id: row.id,
      userId: row.userId,
      provider: row.provider,
      providerUserId: row.providerUserId,
      passwordHash: row.passwordHash,
      emailVerified: row.emailVerified,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
