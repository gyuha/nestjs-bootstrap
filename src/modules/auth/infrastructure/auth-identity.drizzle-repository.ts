import { and, eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type {
  AuthIdentityRepository,
  CreateAuthIdentityRepositoryInput,
} from "../domain/auth-identity.repository";
import type { AuthIdentity, AuthProvider } from "../domain/auth-identity.types";
import { authIdentities, type schema } from "../../../shared/infrastructure/database/schema";

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
    const [row] = await this.db
      .insert(authIdentities)
      .values({
        userId: input.userId,
        provider: input.provider,
        providerUserId: input.providerUserId,
        passwordHash: input.passwordHash,
        emailVerified: input.emailVerified,
      })
      .returning();

    return this.toDomain(row);
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
