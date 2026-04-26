import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsObject, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CreateKnowledgeDocumentDto {
  @ApiProperty({
    description: "Knowledge document title.",
    example: "Refund Policy",
    minLength: 1,
    maxLength: 200,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @ApiProperty({
    description: "Stable source key for the document.",
    example: "refund-policy",
    minLength: 1,
    maxLength: 300,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  sourceKey!: string;

  @ApiProperty({
    description: "Plain text content to index.",
    example: "Refunds are available within seven days.",
    minLength: 1,
  })
  @IsString()
  @MinLength(1)
  content!: string;

  @ApiPropertyOptional({
    description: "Additional structured metadata stored with the document.",
    example: { category: "policy" },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
