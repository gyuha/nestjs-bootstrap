import { type ExceptionFilter, type ArgumentsHost } from '@nestjs/common';
export declare class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger;
    catch(exception: unknown, host: ArgumentsHost): void;
    private getDefaultCode;
}
