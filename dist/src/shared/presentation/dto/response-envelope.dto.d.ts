export declare class ResponseMetaDto {
    traceId: string;
}
export declare class ResponseEnvelopeDto<T> {
    data: T;
    meta: ResponseMetaDto;
}
export declare class ErrorDetailDto {
    code: string;
    message: string;
    details?: Record<string, unknown>;
}
export declare class ErrorResponseDto {
    error: ErrorDetailDto;
    meta: ResponseMetaDto;
}
