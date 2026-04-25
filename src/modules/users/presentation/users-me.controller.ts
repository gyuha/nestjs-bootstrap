import { Body, Controller, Get, Inject, NotFoundException, Patch, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { CurrentUser } from "../../auth/presentation/current-user.decorator";
import { JwtAuthGuard } from "../../auth/presentation/jwt-auth.guard";
import type { AuthenticatedUser } from "../../auth/presentation/request-user";
import { GetCurrentUser, UpdateCurrentUserProfile } from "../application/users.use-cases";
import { UserNotFoundError } from "../application/user.errors";
import { UpdateCurrentUserProfileDto } from "./users.dto";

@ApiTags("users")
@ApiBearerAuth()
@Controller({ path: "users/me", version: "1" })
@UseGuards(JwtAuthGuard)
export class UsersMeController {
  @Inject(GetCurrentUser)
  private readonly getCurrentUser!: GetCurrentUser;

  @Inject(UpdateCurrentUserProfile)
  private readonly updateCurrentUserProfile!: UpdateCurrentUserProfile;

  @Get()
  @ApiOperation({ summary: "Get the current user profile" })
  @ApiOkResponse({ description: "Returns the current user profile." })
  @ApiUnauthorizedResponse({ description: "Bearer token is missing or invalid." })
  @ApiNotFoundResponse({ description: "The authenticated user no longer exists." })
  async getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.run(() => this.getCurrentUser.execute(user.id));
  }

  @Patch()
  @ApiBody({ type: UpdateCurrentUserProfileDto })
  @ApiOperation({ summary: "Update the current user profile" })
  @ApiOkResponse({ description: "Returns the updated current user profile." })
  @ApiUnauthorizedResponse({ description: "Bearer token is missing or invalid." })
  @ApiNotFoundResponse({ description: "The authenticated user no longer exists." })
  async updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: UpdateCurrentUserProfileDto,
  ) {
    return this.run(() => this.updateCurrentUserProfile.execute(user.id, body));
  }

  private async run<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof UserNotFoundError) {
        throw new NotFoundException(error.message);
      }

      throw error;
    }
  }
}
