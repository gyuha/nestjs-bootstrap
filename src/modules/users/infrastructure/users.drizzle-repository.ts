import { and, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { PageResult } from "../../../shared/domain/pagination";
import { User } from "../domain/user.entity";
import type {
  CreateUserRepositoryInput,
  ListUsersFilter,
  UserRepository,
} from "../domain/user.repository";
import { users, type schema } from "../../../shared/infrastructure/database/schema";

type Database = NodePgDatabase<typeof schema>;
type UserRow = typeof users.$inferSelect;

export class DrizzleUserRepository implements UserRepository {
  constructor(private readonly db: Database) {}

  async create(input: CreateUserRepositoryInput): Promise<User> {
    const [row] = await this.db
      .insert(users)
      .values({
        email: input.email,
        displayName: input.displayName,
        avatarUrl: input.avatarUrl,
        bio: input.bio,
        role: input.role,
        status: input.status,
      })
      .returning();

    return this.toDomain(row);
  }

  async findById(id: string): Promise<User | null> {
    const [row] = await this.db.select().from(users).where(eq(users.id, id)).limit(1);

    return row ? this.toDomain(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const [row] = await this.db.select().from(users).where(eq(users.email, email)).limit(1);

    return row ? this.toDomain(row) : null;
  }

  async list(filter: ListUsersFilter): Promise<PageResult<User>> {
    const where = this.buildWhere(filter);
    const offset = (filter.page - 1) * filter.limit;

    const [items, totalRows] = await Promise.all([
      this.db.select().from(users).where(where).limit(filter.limit).offset(offset),
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
      const pattern = `%${filter.search}%`;
      const searchCondition = or(ilike(users.email, pattern), ilike(users.displayName, pattern));

      if (searchCondition) {
        conditions.push(searchCondition);
      }
    }

    return conditions.length > 0 ? and(...conditions) : undefined;
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
