import { type MiddlewareConsumer, Module, type NestModule } from '@nestjs/common';
import { MetricsController } from './metrics.controller';
import { MetricsMiddleware } from './metrics.middleware';
import { MetricsStore } from './metrics.store';

@Module({
  controllers: [MetricsController],
  providers: [MetricsStore],
  exports: [MetricsStore],
})
export class MetricsModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(MetricsMiddleware).forRoutes('*');
  }
}
