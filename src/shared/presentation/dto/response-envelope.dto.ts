import { ApiProperty } from "@nestjs/swagger";

export class ResponseMetaDto {
  @ApiProperty()
  traceId: string;
}

export class ResponseEnvelopeDto<T> {
  @ApiProperty()
  data: T;
  @ApiProperty({ type: ResponseMetaDto })
  meta: ResponseMetaDto;
}

export class ErrorDetailDto {
  @ApiProperty()
  code: string;
  @ApiProperty()
  message: string;
  @ApiProperty({ type: Object, required: false })
  details?: Record<string, unknown>;
}

export class ErrorResponseDto {
  @ApiProperty({ type: ErrorDetailDto })
  error: ErrorDetailDto;
  @ApiProperty({ type: ResponseMetaDto })
  meta: ResponseMetaDto;
}
