import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  UseInterceptors,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { ChatUseCase } from "../../application/services/chat-use-case";
import { EmbedUseCase } from "../../application/services/embedding-use-case";
import { ChatRequestDto } from "../../application/dto/request/chat-request.dto";
import { EmbedRequestDto } from "../../application/dto/request/embed-request.dto";
import { ApiKeyGuard } from "../guards/api-key.guard";
import { TokenUsageInterceptor } from "../interceptors/token-usage.interceptor";

@ApiTags("AI Gateway")
@Controller("ai")
export class AiGatewayController {
  constructor(
    private readonly chatUseCase: ChatUseCase,
    private readonly embedUseCase: EmbedUseCase,
  ) {}

  @Post("chat")
  @ApiOperation({ summary: "Send a chat message" })
  @ApiResponse({ status: 200, description: "Chat response" })
  @UseGuards(ApiKeyGuard)
  @UseInterceptors(TokenUsageInterceptor)
  @HttpCode(HttpStatus.OK)
  async chat(@Body() dto: ChatRequestDto) {
    return this.chatUseCase.execute(dto);
  }

  @Post("embed")
  @ApiOperation({ summary: "Embed text" })
  @ApiResponse({ status: 200, description: "Embedding response" })
  @UseGuards(ApiKeyGuard)
  @UseInterceptors(TokenUsageInterceptor)
  @HttpCode(HttpStatus.OK)
  async embed(@Body() dto: EmbedRequestDto) {
    return this.embedUseCase.execute(dto);
  }

  @Get("models")
  @ApiOperation({ summary: "Get available AI models" })
  @ApiResponse({ status: 200, description: "List of models" })
  @UseGuards(ApiKeyGuard)
  async models() {
    return {
      data: [
        { id: "gpt-4o", provider: "openai", name: "GPT-4o" },
        { id: "gpt-4o-mini", provider: "openai", name: "GPT-4o Mini" },
      ],
    };
  }
}
