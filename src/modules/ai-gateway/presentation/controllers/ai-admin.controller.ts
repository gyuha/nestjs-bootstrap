import { Controller, Post, Get, Delete, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { RAGService } from '../../../rag/application/services/rag.service';
import { LoggingService } from '../../../monitoring/application/services/logging.service';
import { MetricsService } from '../../../monitoring/application/services/metrics.service';
import { LogFilters } from '../../../monitoring/domain/entities/api-log.entity';
import { MetricFilters } from '../../../monitoring/application/services/metrics.service';
import { ChunkStrategy } from '../../../rag/domain/value-objects/chunk-strategy.vo';

export class IndexRequestDto {
  source!: string;
  chunkSize?: number;
  chunkOverlap?: number;
  chunkStrategy?: ChunkStrategy;
}

@Controller('api/v1/ai/admin')
export class AiAdminController {
  constructor(
    private readonly ragService: RAGService,
    private readonly loggingService: LoggingService,
    private readonly metricsService: MetricsService,
  ) {}

  @Post('index')
  @HttpCode(HttpStatus.OK)
  async indexDocuments(@Body() dto: IndexRequestDto) {
    await this.ragService.indexDocuments(dto.source, {
      chunkSize: dto.chunkSize,
      chunkOverlap: dto.chunkOverlap,
      chunkStrategy: dto.chunkStrategy,
    });
    return { success: true };
  }

  @Delete('index/:source')
  @HttpCode(HttpStatus.OK)
  async deleteIndexedDocuments(@Param('_source') _source: string) {
    // TODO: Implement deletion logic using _source
    return { success: true };
  }

  @Get('logs')
  async getLogs(@Query() filters: LogFilters) {
    const logs = await this.loggingService.findLogs(filters);
    return { data: logs };
  }

  @Get('metrics')
  async getMetrics(@Query() filters: MetricFilters) {
    const metrics = await this.metricsService.aggregateMetrics(filters);
    return { data: metrics };
  }

  @Get('metrics/prometheus')
  async getPrometheusMetrics(@Query() filters: MetricFilters) {
    const metrics = await this.metricsService.aggregateMetrics(filters);
    // Format as Prometheus text
    return `# HELP ai_total_requests Total AI API requests
# TYPE ai_total_requests counter
ai_total_requests ${metrics.totalRequests}
# HELP ai_total_tokens Total AI tokens used
# TYPE ai_total_tokens counter
ai_total_tokens ${metrics.totalPromptTokens + metrics.totalCompletionTokens}
# HELP ai_cost_total Total AI cost in USD
# TYPE ai_cost_total counter
ai_cost_total ${metrics.costUsd}
# HELP ai_error_rate Error rate percentage
# TYPE ai_error_rate gauge
ai_error_rate ${metrics.errorRate}
# HELP ai_rag_hit_rate RAG hit rate percentage
# TYPE ai_rag_hit_rate gauge
ai_rag_hit_rate ${metrics.ragHitRate}`;
  }
}