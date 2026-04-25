import { Controller, Post, Get, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ChatUseCase } from '../../application/services/chat-use-case';
import { EmbedUseCase } from '../../application/services/embedding-use-case';
import type { ChatRequestDto } from '../../application/dto/request/chat-request.dto';
import type { EmbedRequestDto } from '../../application/dto/request/embed-request.dto';
import { ApiKeyGuard } from '../guards/api-key.guard';
import { TokenUsageInterceptor } from '../interceptors/token-usage.interceptor';
import { UseInterceptors } from '@nestjs/common';

@Controller('api/v1/ai')
export class AiGatewayController {
  constructor(
    private readonly chatUseCase: ChatUseCase,
    private readonly embedUseCase: EmbedUseCase,
  ) {}

  @Post('chat')
  @UseGuards(ApiKeyGuard)
  @UseInterceptors(TokenUsageInterceptor)
  @HttpCode(HttpStatus.OK)
  async chat(@Body() dto: ChatRequestDto) {
    return this.chatUseCase.execute(dto);
  }

  @Post('embed')
  @UseGuards(ApiKeyGuard)
  @UseInterceptors(TokenUsageInterceptor)
  @HttpCode(HttpStatus.OK)
  async embed(@Body() dto: EmbedRequestDto) {
    return this.embedUseCase.execute(dto);
  }

  @Get('models')
  async models() {
    return {
      data: [
        { id: 'gpt-4o', provider: 'openai', name: 'GPT-4o' },
        { id: 'gpt-4o-mini', provider: 'openai', name: 'GPT-4o Mini' },
      ],
    };
  }
}
