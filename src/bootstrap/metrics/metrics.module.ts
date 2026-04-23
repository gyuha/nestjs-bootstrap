import {
  type MiddlewareConsumer,
  Module,
  type NestModule,
} from '@nestjs/common';
import { MetricsController } from './metrics.controller';
import { MetricsMiddleware } from './metrics.middleware';
import { MetricsStore } from './metrics.store';

/** 요청 메트릭 수집 및 노출을 담당하는 NestJS 모듈 */
@Module({
  controllers: [MetricsController],
  providers: [MetricsStore],
  exports: [MetricsStore],
})
export class MetricsModule implements NestModule {
  /**
   * 모든 라우트에 MetricsMiddleware를 적용한다.
   * @param consumer NestJS 미들웨어 소비자
   */
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(MetricsMiddleware).forRoutes('*');
  }
}
