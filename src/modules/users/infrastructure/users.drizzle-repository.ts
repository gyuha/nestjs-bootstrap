import { and, asc, eq, or, type SQL, sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { PageResult } from "../../../shared/domain/pagination";
import { type schema, users } from "../../../shared/infrastructure/database/schema";
import { normalizeEmail, User } from "../domain/user.entity";
import type {
  CreateUserRepositoryInput,
  ListUsersFilter,
  UserRepository,
} from "../domain/user.repository";
import { DuplicateUserEmailError } from "../domain/user.repository";

type Database = NodePgDatabase<typeof schema>;
type UserRow = typeof users.$inferSelect;

export class DrizzleUserRepository implements UserRepository {
  constructor(private readonly db: Database) {}

  async create(input: CreateUserRepositoryInput): Promise<User> {
    try {
      const [row] = await this.db
        .insert(users)
        .values({
          email: normalizeEmail(input.email),
          displayName: input.displayName,
          avatarUrl: input.avatarUrl,
          bio: input.bio,
          role: input.role,
          status: input.status,
        })
        .returning();

      return this.toDomain(row);
    } catch (error) {
      if (this.isDuplicateEmailError(error)) {
        throw new DuplicateUserEmailError();
      }

      throw error;
    }
  }

  private isDuplicateEmailError(error: unknown): boolean {
    const cause = this.getErrorCause(error);

    return cause?.code === "23505" && cause.constraint === "users_email_lower_unique";
  }

  async findById(id: string): Promise<User | null> {
    const [row] = await this.db.select().from(users).where(eq(users.id, id)).limit(1);

    return row ? this.toDomain(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const [row] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, normalizeEmail(email)))
      .limit(1);

    return row ? this.toDomain(row) : null;
  }

  async list(filter: ListUsersFilter): Promise<PageResult<User>> {
    const where = this.buildWhere(filter);
    const offset = (filter.page - 1) * filter.limit;

    const [items, totalRows] = await Promise.all([
      this.db
        .select()
        .from(users)
        .where(where)
        .orderBy(asc(users.createdAt), asc(users.id))
        .limit(filter.limit)
        .offset(offset),
      this.db.select({ total: sql<number>`count(*)::int` }).from(users).where(where),
    ]);

    return {
      items: items.map((row) => this.toDomain(row)),
      page: filter.page,
      limit: filter.limit,
      total: totalRows[0]?.total ?? 0,
    };
  }

  async update(user: User): Promise<User> {
    const [row] = await this.db
      .update(users)
      .set({
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        role: user.role,
        status: user.status,
      })
      .where(eq(users.id, user.id))
      .returning();

    if (!row) {
      throw new Error(`User not found: ${user.id}`);
    }

    return this.toDomain(row);
  }

  private buildWhere(filter: ListUsersFilter): SQL | undefined {
    const conditions: SQL[] = [];

    if (filter.status) {
      conditions.push(eq(users.status, filter.status));
    }

    if (filter.role) {
      conditions.push(eq(users.role, filter.role));
    }

    if (filter.search) {
      const pattern = `%${this.escapeLikePattern(filter.search)}%`;
      const searchCondition = or(
        sql`${users.email} ilike ${pattern} escape '\\'`,
        sql`${users.displayName} ilike ${pattern} escape '\\'`,
      );

      if (searchCondition) {
        conditions.push(searchCondition);
      }
    }

    return conditions.length > 0 ? and(...conditions) : undefined;
  }

  private escapeLikePattern(input: string): string {
    return input.replaceAll("\\", "\\\\").replaceAll("%", "\\%").replaceAll("_", "\\_");
  }

  private getErrorCause(error: unknown): { code?: string; constraint?: string } | null {
    if (!error || typeof error !== "object" || !("cause" in error)) {
      return null;
    }

    const cause = (error as { cause?: unknown }).cause;

    if (!cause || typeof cause !== "object") {
      return null;
    }

    return cause as { code?: string; constraint?: string };
  }

  private toDomain(row: UserRow): User {
    return User.create({
      id: row.id,
      email: row.email,
      displayName: row.displayName,
      avatarUrl: row.avatarUrl,
      bio: row.bio,
      role: row.role,
      status: row.status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
