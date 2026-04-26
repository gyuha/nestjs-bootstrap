import { Body, ConflictException, Controller, Inject, Post, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { CurrentUser } from "../../auth/presentation/current-user.decorator";
import { JwtAuthGuard } from "../../auth/presentation/jwt-auth.guard";
import type { AuthenticatedUser } from "../../auth/presentation/request-user";
import { Roles } from "../../auth/presentation/roles.decorator";
import { RolesGuard } from "../../auth/presentation/roles.guard";
import { CreateKnowledgeDocument } from "../application/create-knowledge-document";
import { KnowledgeDocumentSourceAlreadyExistsError } from "../domain/knowledge.repository";
import { CreateKnowledgeDocumentDto } from "./knowledge.dto";

@ApiTags("knowledge")
@ApiBearerAuth()
@Controller({ path: "knowledge/documents", version: "1" })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN")
export class KnowledgeAdminController {
  @Inject(CreateKnowledgeDocument)
  private readonly createKnowledgeDocument!: CreateKnowledgeDocument;

  @Post()
  @ApiBody({ type: CreateKnowledgeDocumentDto })
  @ApiOperation({ summary: "Create and index a knowledge document" })
  @ApiCreatedResponse({ description: "Returns the indexed knowledge document." })
  @ApiUnauthorizedResponse({ description: "Bearer token is missing or invalid." })
  @ApiForbiddenResponse({ description: "The authenticated user is not an admin." })
  @ApiConflictResponse({ description: "A knowledge document with the source already exists." })
  async create(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateKnowledgeDocumentDto) {
    return this.run(() =>
      this.createKnowledgeDocument.execute({
        title: body.title,
        sourceKey: body.sourceKey,
        content: body.content,
        metadata: body.metadata,
        createdBy: user.id,
      }),
    );
  }

  private async run<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof KnowledgeDocumentSourceAlreadyExistsError) {
        throw new ConflictException(error.message);
      }

      throw error;
    }
  }
}
