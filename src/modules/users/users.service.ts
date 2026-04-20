import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { CreateUserDto } from './dto/create-user.dto';
import type { UpdateUserDto } from './dto/update-user.dto';
// biome-ignore lint/style/useImportType: NestJS DI requires runtime value for @Inject decorator
import { DRIZZLE_CLIENT } from '../../shared/infrastructure/database/database.token';
import * as schema from './schemas/user.schema';
import * as argon2 from 'argon2';

@Injectable()
export class UsersService {
  constructor(
    // biome-ignore lint/suspicious/noExplicitAny: drizzle client union type not statically resolvable
    @Inject(DRIZZLE_CLIENT) private readonly db: any,
  ) {}

  async create(dto: CreateUserDto): Promise<schema.User> {
    const passwordHash = dto.password
      ? await argon2.hash(dto.password)
      : null;

    const [user] = await this.db
      .insert(schema.users)
      .values({
        email: dto.email,
        passwordHash,
      })
      .returning();

    return user;
  }

  async findByEmail(email: string): Promise<schema.User | null> {
    const [user] = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);

    return user ?? null;
  }

  async findById(id: string): Promise<schema.User | null> {
    const [user] = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, id))
      .limit(1);

    return user ?? null;
  }

  async findAll(): Promise<schema.User[]> {
    return this.db.select().from(schema.users);
  }

  async update(id: string, dto: UpdateUserDto): Promise<schema.User | null> {
    const [user] = await this.db
      .update(schema.users)
      .set({
        ...dto,
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, id))
      .returning();

    return user ?? null;
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(schema.users).where(eq(schema.users.id, id));
  }

  async getUserRoles(userId: string): Promise<string[]> {
    const results = await this.db
      .select({ name: schema.roles.name })
      .from(schema.userRoles)
      .innerJoin(schema.roles, eq(schema.userRoles.roleId, schema.roles.id))
      .where(eq(schema.userRoles.userId, userId));

    return results.map((r: { name: string }) => r.name);
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    const results = await this.db
      .select({ permission: schema.rolePermissions.permission })
      .from(schema.userRoles)
      .innerJoin(schema.roles, eq(schema.userRoles.roleId, schema.roles.id))
      .innerJoin(
        schema.rolePermissions,
        eq(schema.rolePermissions.roleId, schema.roles.id),
      )
      .where(eq(schema.userRoles.userId, userId));

    return results.map((r: { permission: string }) => r.permission);
  }

  async assignRole(userId: string, roleId: string): Promise<void> {
    await this.db.insert(schema.userRoles).values({
      userId,
      roleId,
    });
  }

  async removeRole(userId: string, roleId: string): Promise<void> {
    await this.db
      .delete(schema.userRoles)
      .where(
        eq(schema.userRoles.userId, userId) &&
          eq(schema.userRoles.roleId, roleId),
      );
  }

  async findAllRoles(): Promise<schema.Role[]> {
    return this.db.select().from(schema.roles);
  }

  async findRoleById(id: string): Promise<schema.Role | null> {
    const [role] = await this.db
      .select()
      .from(schema.roles)
      .where(eq(schema.roles.id, id))
      .limit(1);

    return role ?? null;
  }

  async createRole(dto: {
    name: string;
    description?: string;
  }): Promise<schema.Role> {
    const [role] = await this.db
      .insert(schema.roles)
      .values({
        name: dto.name,
        description: dto.description,
      })
      .returning();

    return role;
  }

  async updateRole(
    id: string,
    dto: { name?: string; description?: string },
  ): Promise<schema.Role | null> {
    const [role] = await this.db
      .update(schema.roles)
      .set(dto)
      .where(eq(schema.roles.id, id))
      .returning();

    return role ?? null;
  }

  async deleteRole(id: string): Promise<void> {
    await this.db.delete(schema.roles).where(eq(schema.roles.id, id));
  }

  async setRolePermissions(roleId: string, permissions: string[]): Promise<void> {
    // Delete existing permissions
    await this.db
      .delete(schema.rolePermissions)
      .where(eq(schema.rolePermissions.roleId, roleId));

    // Insert new permissions
    if (permissions.length > 0) {
      await this.db.insert(schema.rolePermissions).values(
        permissions.map((permission) => ({
          roleId,
          permission,
        })),
      );
    }
  }
}
