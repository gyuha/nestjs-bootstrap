import { Controller, Get, Version } from '@nestjs/common';

import { AppService } from './app.service';
import { createApiResponse } from './shared/presentation/api-response';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Version('1')
  getRoot() {
    return createApiResponse(this.appService.getFoundationStatus(), {
      traceId: this.appService.getCurrentTraceId(),
    });
  }
}
