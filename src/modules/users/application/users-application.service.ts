import { Injectable, Inject } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import type { UserRepository } from "../domain/repository/user.repository.interface";
import type { UserEntity } from "../domain/entities/user.entity";
import type { CreateUserDto, UpdateUserDto } from "./dto/users.dto";
import { Role, UserStatus } from "../domain/value-objects/role.value-object";
import { UserException } from "../presentation/exceptions/user.exception";

const USER_REPOSITORY = "USER_REPOSITORY";

@Injectable()
export class UsersApplicationService {
  constructor(@Inject(USER_REPOSITORY) private readonly userRepo: UserRepository) {}

  async create(dto: CreateUserDto): Promise<UserEntity> {
    const existing = await this.userRepo.findByEmail(dto.email);
    if (existing) throw UserException.emailAlreadyExists();

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user: UserEntity = {
      id: crypto.randomUUID(),
      email: dto.email,
      passwordHash,
      name: dto.name,
      role: dto.role || Role.USER,
      status: UserStatus.ACTIVE,
      emailVerified: false,
      lockoutUntil: null,
      failedLoginAttempts: 0,
      verificationToken: null,
      verificationTokenExpiry: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.userRepo.save(user);
    return user;
  }

  async findById(id: string): Promise<UserEntity> {
    const user = await this.userRepo.findById(id);
    if (!user) throw UserException.notFound();
    return user;
  }

  async findAll(query: {
    email?: string;
    role?: Role;
    status?: UserStatus;
    page?: number;
    limit?: number;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    const allUsers: UserEntity[] = [];

    return {
      data: allUsers.slice(offset, offset + limit),
      total: allUsers.length,
      page,
      limit,
    };
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserEntity> {
    const user = await this.userRepo.findById(id);
    if (!user) throw UserException.notFound();

    const updated: UserEntity = {
      ...user,
      ...(dto.name && { name: dto.name }),
      ...(dto.role && { role: dto.role }),
      ...(dto.status && { status: dto.status }),
      updatedAt: new Date(),
    };

    await this.userRepo.update(updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    const user = await this.userRepo.findById(id);
    if (!user) throw UserException.notFound();
    await this.userRepo.delete(id);
  }
}
