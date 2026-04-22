// src/shared/presentation/dto/api-response.dto.ts
export interface ApiResponse<T> {
  success: true;
  data: T;
  timestamp: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    statusCode: number;
    message: string | string[];
    details?: string[];
  };
  timestamp: string;
}
