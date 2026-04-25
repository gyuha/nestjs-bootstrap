import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const API_KEY = 'api-key';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];

    // Get the expected API key from config or use a default for development
    const expectedApiKey = process.env.AI_GATEWAY_API_KEY || 'dev-api-key';

    if (apiKey !== expectedApiKey) {
      throw new UnauthorizedException('Invalid API key');
    }
    return true;
  }
}
