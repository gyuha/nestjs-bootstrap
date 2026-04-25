import {
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiExtraModels, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../auth/presentation/jwt-auth.guard";
import { Roles } from "../../auth/presentation/roles.decorator";
import { RolesGuard } from "../../auth/presentation/roles.guard";
import { UserEmailAlreadyExistsError, UserNotFoundError } from "../application/user.errors";
import {
  ChangeUserRole,
  ChangeUserStatus,
  CreateUserByAdmin,
  DeactivateUser,
  GetUserById,
  ListUsers,
  UpdateUserByAdmin,
} from "../application/users.use-cases";
import {
  ChangeUserRoleDto,
  ChangeUserStatusDto,
  CreateUserByAdminDto,
  ListUsersQueryDto,
  UpdateUserByAdminDto,
} from "./users.dto";

@ApiTags("users")
@ApiBearerAuth()
@ApiExtraModels(ListUsersQueryDto)
@Controller({ path: "users", version: "1" })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN")
export class UsersAdminController {
  @Inject(ListUsers)
  private readonly listUsers!: ListUsers;

  @Inject(CreateUserByAdmin)
  private readonly createUserByAdmin!: CreateUserByAdmin;

  @Inject(GetUserById)
  private readonly getUserById!: GetUserById;

  @Inject(UpdateUserByAdmin)
  private readonly updateUserByAdmin!: UpdateUserByAdmin;

  @Inject(ChangeUserStatus)
  private readonly changeUserStatus!: ChangeUserStatus;

  @Inject(ChangeUserRole)
  private readonly changeUserRole!: ChangeUserRole;

  @Inject(DeactivateUser)
  private readonly deactivateUser!: DeactivateUser;

  @Get()
  async list(@Query() query: ListUsersQueryDto) {
    return this.run(() => this.listUsers.execute(query));
  }

  @Post()
  @ApiBody({ type: CreateUserByAdminDto })
  async create(@Body() body: CreateUserByAdminDto) {
    return this.run(() => this.createUserByAdmin.execute(body));
  }

  @Get(":id")
  async getById(@Param("id", ParseUUIDPipe) id: string) {
    return this.run(() => this.getUserById.execute(id));
  }

  @Patch(":id")
  @ApiBody({ type: UpdateUserByAdminDto })
  async update(@Param("id", ParseUUIDPipe) id: string, @Body() body: UpdateUserByAdminDto) {
    return this.run(() => this.updateUserByAdmin.execute(id, body));
  }

  @Patch(":id/status")
  @ApiBody({ type: ChangeUserStatusDto })
  async updateStatus(@Param("id", ParseUUIDPipe) id: string, @Body() body: ChangeUserStatusDto) {
    return this.run(() => this.changeUserStatus.execute(id, body.status));
  }

  @Patch(":id/role")
  @ApiBody({ type: ChangeUserRoleDto })
  async updateRole(@Param("id", ParseUUIDPipe) id: string, @Body() body: ChangeUserRoleDto) {
    return this.run(() => this.changeUserRole.execute(id, body.role));
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  async deactivate(@Param("id", ParseUUIDPipe) id: string) {
    return this.run(() => this.deactivateUser.execute(id));
  }

  private async run<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof UserNotFoundError) {
        throw new NotFoundException(error.message);
      }

      if (error instanceof UserEmailAlreadyExistsError) {
        throw new ConflictException(error.message);
      }

      throw error;
    }
  }
}
