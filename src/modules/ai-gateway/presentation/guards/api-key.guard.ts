import { Injectable, type CanActivate, type ExecutionContext, UnauthorizedException } from '@nestjs/common';

export const API_KEY = 'api-key';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];

    const expectedApiKey = process.env.AI_GATEWAY_API_KEY;

    if (!expectedApiKey) {
      throw new UnauthorizedException('AI_GATEWAY_API_KEY environment variable is not configured');
    }

    if (apiKey !== expectedApiKey) {
      throw new UnauthorizedException('Invalid API key');
    }
    return true;
  }
}
