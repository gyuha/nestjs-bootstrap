import { IsString, IsOptional, IsBoolean, IsNumber, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChatRequestDto {
  @ApiProperty({ description: 'The user message to send to the AI' })
  @IsString()
  message: string;

  @ApiPropertyOptional({ description: 'Session ID for conversation tracking' })
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiPropertyOptional({ description: 'User ID for tracking' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ description: 'Model to use', example: 'gpt-4o' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ description: 'System prompt for context' })
  @IsOptional()
  @IsString()
  systemPrompt?: string;

  @ApiPropertyOptional({ description: 'Whether to use RAG for context', default: false })
  @IsOptional()
  @IsBoolean()
  useRag?: boolean;

  @ApiPropertyOptional({ description: 'Temperature for response generation', example: 0.7 })
  @IsOptional()
  @IsNumber()
  temperature?: number;

  @ApiPropertyOptional({ description: 'Maximum tokens in response' })
  @IsOptional()
  @IsNumber()
  maxTokens?: number;

  @ApiPropertyOptional({ description: 'Number of top results for RAG', default: 5 })
  @IsOptional()
  @IsNumber()
  topK?: number;

  @ApiPropertyOptional({ description: 'AI provider to use' })
  @IsOptional()
  @IsString()
  provider?: string;
}