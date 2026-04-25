// src/modules/audit/presentation/controllers/audit.controller.ts
import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { AuditApplicationService } from '../../application/services/audit-application.service';
import { QueryAuditLogsDto, AuditLogListResponseDto } from '../../application/dto/audit.dto';
import { JwtAuthGuard } from '../../../../modules/auth/presentation/guards/jwt-auth.guard';
import { AuditAccessGuard } from '../guards/audit-access.guard';
import { ResponseEnvelopeInterceptor } from '../../../../shared/presentation/interceptors/response-envelope.interceptor';
import { UseInterceptors } from '@nestjs/common';
import type { Request } from 'express';

@ApiTags('Audit')
@Controller('audit-logs')
@UseGuards(ThrottlerGuard, JwtAuthGuard, AuditAccessGuard)
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@UseInterceptors(ResponseEnvelopeInterceptor)
export class AuditController {
  constructor(private readonly auditService: AuditApplicationService) {}

  @Get()
  @ApiOperation({ summary: 'Query audit logs' })
  @ApiResponse({ status: 200, type: AuditLogListResponseDto })
  async queryLogs(@Query() dto: QueryAuditLogsDto, @Req() req: Request): Promise<AuditLogListResponseDto> {
    const filter = {
      userId: dto.userId,
      eventType: dto.eventType,
      from: dto.from ? new Date(dto.from) : undefined,
      to: dto.to ? new Date(dto.to) : undefined,
      page: dto.page,
      limit: dto.limit,
    };
    return this.auditService.queryLogs(filter);
  }
}