import { randomUUID } from "node:crypto";
import type { UserProfilePatch, UserRole, UserStatus } from "./user.types";

export type CreateUserInput = {
  id?: string;
  email: string;
  displayName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  role?: UserRole;
  status?: UserStatus;
  createdAt?: Date;
  updatedAt?: Date;
};

export class User {
  private constructor(
    readonly id: string,
    readonly email: string,
    private _displayName: string,
    private _avatarUrl: string | null,
    private _bio: string | null,
    private _role: UserRole,
    private _status: UserStatus,
    readonly createdAt: Date,
    readonly updatedAt: Date,
  ) {}

  static create(input: CreateUserInput): User {
    const now = new Date();

    return new User(
      input.id ?? randomUUID(),
      normalizeEmail(input.email),
      input.displayName,
      input.avatarUrl ?? null,
      input.bio ?? null,
      input.role ?? "USER",
      input.status ?? "active",
      input.createdAt ?? now,
      input.updatedAt ?? now,
    );
  }

  get displayName(): string {
    return this._displayName;
  }

  get avatarUrl(): string | null {
    return this._avatarUrl;
  }

  get bio(): string | null {
    return this._bio;
  }

  get role(): UserRole {
    return this._role;
  }

  get status(): UserStatus {
    return this._status;
  }

  updateProfile(patch: UserProfilePatch): void {
    if (patch.displayName !== undefined) {
      this._displayName = patch.displayName;
    }

    if (patch.avatarUrl !== undefined) {
      this._avatarUrl = patch.avatarUrl;
    }

    if (patch.bio !== undefined) {
      this._bio = patch.bio;
    }
  }

  changeRole(role: UserRole): void {
    this._role = role;
  }

  changeStatus(status: UserStatus): void {
    this._status = status;
  }

  deactivate(): void {
    this.changeStatus("inactive");
  }
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
