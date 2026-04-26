import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class SendChatMessageDto {
  @ApiProperty({
    description: "User message to send to the support assistant.",
    example: "What is the refund policy?",
    minLength: 1,
    maxLength: 4000,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  message!: string;

  @ApiPropertyOptional({
    description: "Whether to include source citations in the response.",
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  includeSources = false;
}
