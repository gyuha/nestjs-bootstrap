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
import {
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
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
  @ApiOperation({ summary: "List users" })
  @ApiOkResponse({ description: "Returns a paginated list of users." })
  @ApiUnauthorizedResponse({ description: "Bearer token is missing or invalid." })
  @ApiForbiddenResponse({ description: "The authenticated user is not an admin." })
  async list(@Query() query: ListUsersQueryDto) {
    return this.run(() => this.listUsers.execute(query));
  }

  @Post()
  @ApiBody({ type: CreateUserByAdminDto })
  @ApiOperation({ summary: "Create a user as an admin" })
  @ApiCreatedResponse({ description: "Returns the created user profile." })
  @ApiUnauthorizedResponse({ description: "Bearer token is missing or invalid." })
  @ApiForbiddenResponse({ description: "The authenticated user is not an admin." })
  @ApiConflictResponse({ description: "A user with the email address already exists." })
  async create(@Body() body: CreateUserByAdminDto) {
    return this.run(() => this.createUserByAdmin.execute(body));
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a user by id" })
  @ApiOkResponse({ description: "Returns the requested user profile." })
  @ApiUnauthorizedResponse({ description: "Bearer token is missing or invalid." })
  @ApiForbiddenResponse({ description: "The authenticated user is not an admin." })
  @ApiNotFoundResponse({ description: "The user does not exist." })
  async getById(@Param("id", ParseUUIDPipe) id: string) {
    return this.run(() => this.getUserById.execute(id));
  }

  @Patch(":id")
  @ApiBody({ type: UpdateUserByAdminDto })
  @ApiOperation({ summary: "Update a user as an admin" })
  @ApiOkResponse({ description: "Returns the updated user profile." })
  @ApiUnauthorizedResponse({ description: "Bearer token is missing or invalid." })
  @ApiForbiddenResponse({ description: "The authenticated user is not an admin." })
  @ApiNotFoundResponse({ description: "The user does not exist." })
  async update(@Param("id", ParseUUIDPipe) id: string, @Body() body: UpdateUserByAdminDto) {
    return this.run(() => this.updateUserByAdmin.execute(id, body));
  }

  @Patch(":id/status")
  @ApiBody({ type: ChangeUserStatusDto })
  @ApiOperation({ summary: "Change a user's status" })
  @ApiOkResponse({ description: "Returns the updated user profile." })
  @ApiUnauthorizedResponse({ description: "Bearer token is missing or invalid." })
  @ApiForbiddenResponse({ description: "The authenticated user is not an admin." })
  @ApiNotFoundResponse({ description: "The user does not exist." })
  async updateStatus(@Param("id", ParseUUIDPipe) id: string, @Body() body: ChangeUserStatusDto) {
    return this.run(() => this.changeUserStatus.execute(id, body.status));
  }

  @Patch(":id/role")
  @ApiBody({ type: ChangeUserRoleDto })
  @ApiOperation({ summary: "Change a user's role" })
  @ApiOkResponse({ description: "Returns the updated user profile." })
  @ApiUnauthorizedResponse({ description: "Bearer token is missing or invalid." })
  @ApiForbiddenResponse({ description: "The authenticated user is not an admin." })
  @ApiNotFoundResponse({ description: "The user does not exist." })
  async updateRole(@Param("id", ParseUUIDPipe) id: string, @Body() body: ChangeUserRoleDto) {
    return this.run(() => this.changeUserRole.execute(id, body.role));
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Deactivate a user" })
  @ApiOkResponse({ description: "Returns the deactivated user profile." })
  @ApiUnauthorizedResponse({ description: "Bearer token is missing or invalid." })
  @ApiForbiddenResponse({ description: "The authenticated user is not an admin." })
  @ApiNotFoundResponse({ description: "The user does not exist." })
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
