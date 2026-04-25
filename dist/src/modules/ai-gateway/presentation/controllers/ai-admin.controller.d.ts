import { RAGService } from "../../../rag/application/services/rag.service";
import { LoggingService } from "../../../monitoring/application/services/logging.service";
import { MetricsService } from "../../../monitoring/application/services/metrics.service";
import { LogFilters } from "../../../monitoring/domain/entities/api-log.entity";
import { MetricFilters } from "../../../monitoring/application/services/metrics.service";
import { ChunkStrategy } from "../../../rag/domain/value-objects/chunk-strategy.vo";
export declare class IndexRequestDto {
  source: string;
  chunkSize?: number;
  chunkOverlap?: number;
  chunkStrategy?: ChunkStrategy;
}
export declare class AiAdminController {
  private readonly ragService;
  private readonly loggingService;
  private readonly metricsService;
  constructor(
    ragService: RAGService,
    loggingService: LoggingService,
    metricsService: MetricsService,
  );
  indexDocuments(dto: IndexRequestDto): Promise<{
    success: boolean;
  }>;
  deleteIndexedDocuments(_source: string): Promise<{
    success: boolean;
  }>;
  getLogs(filters: LogFilters): Promise<{
    data: import("../../../monitoring/domain/entities/api-log.entity").LogEntry[];
  }>;
  getMetrics(filters: MetricFilters): Promise<{
    data: import("../../../monitoring/domain/entities/token-usage-log.entity").AggregatedMetrics;
  }>;
  getPrometheusMetrics(filters: MetricFilters): Promise<string>;
}
