import { Inject, Injectable } from "@nestjs/common";
import type { PageResult } from "../../../shared/domain/pagination";
import {
  type CreateUserRepositoryInput,
  type ListUsersFilter,
  USER_REPOSITORY,
  type UserRepository,
} from "../domain/user.repository";
import type { UserProfilePatch, UserRole, UserStatus } from "../domain/user.types";
import { UserEmailAlreadyExistsError, UserNotFoundError } from "./user.errors";
import { toUserResponse, type UserResponse } from "./user.response";

@Injectable()
export class GetCurrentUser {
  @Inject(USER_REPOSITORY)
  private readonly users!: UserRepository;

  async execute(userId: string): Promise<UserResponse> {
    return toUserResponse(await this.findUser(userId));
  }

  private async findUser(userId: string) {
    const user = await this.users.findById(userId);

    if (!user) {
      throw new UserNotFoundError();
    }

    return user;
  }
}

@Injectable()
export class UpdateCurrentUserProfile {
  @Inject(USER_REPOSITORY)
  private readonly users!: UserRepository;

  async execute(userId: string, patch: UserProfilePatch): Promise<UserResponse> {
    const user = await this.users.findById(userId);

    if (!user) {
      throw new UserNotFoundError();
    }

    user.updateProfile(patch);
    return toUserResponse(await this.users.update(user));
  }
}

@Injectable()
export class ListUsers {
  @Inject(USER_REPOSITORY)
  private readonly users!: UserRepository;

  async execute(filter: ListUsersFilter): Promise<PageResult<UserResponse>> {
    const result = await this.users.list(filter);

    return {
      ...result,
      items: result.items.map((user) => toUserResponse(user)),
    };
  }
}

@Injectable()
export class CreateUserByAdmin {
  @Inject(USER_REPOSITORY)
  private readonly users!: UserRepository;

  async execute(input: CreateUserRepositoryInput): Promise<UserResponse> {
    const existing = await this.users.findByEmail(input.email);

    if (existing) {
      throw new UserEmailAlreadyExistsError();
    }

    return toUserResponse(await this.users.create(input));
  }
}

@Injectable()
export class GetUserById {
  @Inject(USER_REPOSITORY)
  private readonly users!: UserRepository;

  async execute(userId: string): Promise<UserResponse> {
    const user = await this.users.findById(userId);

    if (!user) {
      throw new UserNotFoundError();
    }

    return toUserResponse(user);
  }
}

@Injectable()
export class UpdateUserByAdmin {
  @Inject(USER_REPOSITORY)
  private readonly users!: UserRepository;

  async execute(
    userId: string,
    patch: UserProfilePatch & { role?: UserRole; status?: UserStatus },
  ): Promise<UserResponse> {
    const user = await this.users.findById(userId);

    if (!user) {
      throw new UserNotFoundError();
    }

    user.updateProfile(patch);

    if (patch.role) {
      user.changeRole(patch.role);
    }

    if (patch.status) {
      user.changeStatus(patch.status);
    }

    return toUserResponse(await this.users.update(user));
  }
}

@Injectable()
export class ChangeUserStatus {
  @Inject(USER_REPOSITORY)
  private readonly users!: UserRepository;

  async execute(userId: string, status: UserStatus): Promise<UserResponse> {
    const user = await this.users.findById(userId);

    if (!user) {
      throw new UserNotFoundError();
    }

    user.changeStatus(status);
    return toUserResponse(await this.users.update(user));
  }
}

@Injectable()
export class ChangeUserRole {
  @Inject(USER_REPOSITORY)
  private readonly users!: UserRepository;

  async execute(userId: string, role: UserRole): Promise<UserResponse> {
    const user = await this.users.findById(userId);

    if (!user) {
      throw new UserNotFoundError();
    }

    user.changeRole(role);
    return toUserResponse(await this.users.update(user));
  }
}

@Injectable()
export class DeactivateUser {
  @Inject(USER_REPOSITORY)
  private readonly users!: UserRepository;

  async execute(userId: string): Promise<UserResponse> {
    const user = await this.users.findById(userId);

    if (!user) {
      throw new UserNotFoundError();
    }

    user.deactivate();
    return toUserResponse(await this.users.update(user));
  }
}

export const userUseCases = [
  GetCurrentUser,
  UpdateCurrentUserProfile,
  ListUsers,
  CreateUserByAdmin,
  GetUserById,
  UpdateUserByAdmin,
  ChangeUserStatus,
  ChangeUserRole,
  DeactivateUser,
];
