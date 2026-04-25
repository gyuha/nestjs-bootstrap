import type { UsersApplicationService } from '../application/users-application.service';
import { type CreateUserDto, type UpdateUserDto, UserResponseDto, type UserQueryDto } from '../application/dto/users.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersApplicationService);
    create(dto: CreateUserDto): Promise<UserResponseDto>;
    findAll(query: UserQueryDto): Promise<{
        data: import("../domain/entities/user.entity").UserEntity[];
        total: number;
        page: number;
        limit: number;
    }>;
    findById(id: string): Promise<UserResponseDto>;
    update(id: string, dto: UpdateUserDto): Promise<UserResponseDto>;
    delete(id: string): Promise<{
        message: string;
    }>;
}
