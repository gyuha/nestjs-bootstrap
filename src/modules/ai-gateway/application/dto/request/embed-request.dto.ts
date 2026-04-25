import { IsArray, IsString, ArrayMinSize } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class EmbedRequestDto {
  @ApiProperty({ description: "Array of texts to embed", type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  texts: string[];
}
