import type { PageRequest, PageResult } from "../../../shared/domain/pagination";
import type { User } from "./user.entity";
import type { UserRole, UserStatus } from "./user.types";

export const USER_REPOSITORY = Symbol("USER_REPOSITORY");

export type CreateUserRepositoryInput = {
  email: string;
  displayName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  role?: UserRole;
  status?: UserStatus;
};

export type ListUsersFilter = PageRequest & {
  status?: UserStatus;
  role?: UserRole;
  search?: string;
};

export interface UserRepository {
  create(input: CreateUserRepositoryInput): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  list(filter: ListUsersFilter): Promise<PageResult<User>>;
  update(user: User): Promise<User>;
}
