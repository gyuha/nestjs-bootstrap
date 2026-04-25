import type { UserRepository } from "../domain/repository/user.repository.interface";
import type { UserEntity } from "../domain/entities/user.entity";
import type { CreateUserDto, UpdateUserDto } from "./dto/users.dto";
import { Role, UserStatus } from "../domain/value-objects/role.value-object";
export declare class UsersApplicationService {
  private readonly userRepo;
  constructor(userRepo: UserRepository);
  create(dto: CreateUserDto): Promise<UserEntity>;
  findById(id: string): Promise<UserEntity>;
  findAll(query: {
    email?: string;
    role?: Role;
    status?: UserStatus;
    page?: number;
    limit?: number;
  }): Promise<{
    data: UserEntity[];
    total: number;
    page: number;
    limit: number;
  }>;
  update(id: string, dto: UpdateUserDto): Promise<UserEntity>;
  delete(id: string): Promise<void>;
}
