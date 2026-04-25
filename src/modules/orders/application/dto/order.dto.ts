import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsInt, IsArray, ValidateNested, Min } from "class-validator";
import { Type } from "class-transformer";

export class OrderItemDto {
  @ApiProperty()
  @IsString()
  productId: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateOrderDto {
  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
