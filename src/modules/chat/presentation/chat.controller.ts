import {
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  Headers,
  Inject,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiHeader,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { CurrentUser } from "../../auth/presentation/current-user.decorator";
import type { AuthenticatedUser } from "../../auth/presentation/request-user";
import { CreateChatSession, SendChatMessage } from "../application/chat.use-cases";
import { SessionTokenService } from "../application/session-token.service";
import type { ChatRepository } from "../domain/chat.repository";
import { CHAT_REPOSITORY } from "../domain/chat.repository";
import type { ChatSession } from "../domain/chat.types";
import { SendChatMessageDto } from "./chat.dto";
import { OptionalJwtAuthGuard } from "./optional-jwt-auth.guard";

@ApiTags("chat")
@Controller({ path: "chat", version: "1" })
@UseGuards(OptionalJwtAuthGuard)
export class ChatController {
  @Inject(CreateChatSession)
  private readonly createChatSession!: CreateChatSession;

  @Inject(SendChatMessage)
  private readonly sendChatMessage!: SendChatMessage;

  @Inject(CHAT_REPOSITORY)
  private readonly chatRepository!: ChatRepository;

  @Inject(SessionTokenService)
  private readonly sessionTokens!: SessionTokenService;

  @Post("sessions")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create an anonymous or authenticated chat session" })
  @ApiCreatedResponse({ description: "Returns the created chat session." })
  async createSession(@CurrentUser() user?: AuthenticatedUser) {
    return this.createChatSession.execute({ userId: user?.id ?? null });
  }

  @Post("sessions/:sessionId/messages")
  @ApiBearerAuth()
  @ApiHeader({
    name: "x-chat-session-token",
    required: false,
    description: "Required when sending messages to an anonymous chat session.",
  })
  @ApiBody({ type: SendChatMessageDto })
  @ApiOperation({ summary: "Send a message to a chat session" })
  @ApiCreatedResponse({ description: "Returns the assistant answer." })
  @ApiUnauthorizedResponse({ description: "Authentication or anonymous session token is missing." })
  @ApiForbiddenResponse({ description: "The requester cannot access this chat session." })
  @ApiNotFoundResponse({ description: "The chat session does not exist." })
  async sendMessage(
    @Param("sessionId", ParseUUIDPipe) sessionId: string,
    @Headers("x-chat-session-token") token: string | undefined,
    @Body() body: SendChatMessageDto,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    const session = await this.assertSessionAccess({ sessionId, token, user });

    if (session.status === "closed") {
      throw new ConflictException("Chat session is closed");
    }

    return this.sendChatMessage.execute({
      sessionId,
      message: body.message,
      includeSources: body.includeSources ?? false,
    });
  }

  private async assertSessionAccess(input: {
    sessionId: string;
    token?: string;
    user?: AuthenticatedUser;
  }): Promise<ChatSession> {
    const session = await this.chatRepository.findSession(input.sessionId);

    if (!session) {
      throw new NotFoundException("Chat session not found");
    }

    if (session.userId) {
      if (!input.user) {
        throw new UnauthorizedException("Authentication required");
      }

      if (session.userId !== input.user.id) {
        throw new ForbiddenException("Chat session access denied");
      }

      return session;
    }

    if (!input.token) {
      throw new UnauthorizedException("Chat session token required");
    }

    const tokenSession = await this.chatRepository.findSessionByAnonymousTokenHash(
      this.sessionTokens.hash(input.token),
    );

    if (tokenSession?.id !== session.id) {
      throw new ForbiddenException("Chat session access denied");
    }

    if (
      tokenSession.anonymousTokenExpiresAt &&
      this.sessionTokens.isExpired(tokenSession.anonymousTokenExpiresAt)
    ) {
      throw new UnauthorizedException("Chat session token expired");
    }

    return session;
  }
}
