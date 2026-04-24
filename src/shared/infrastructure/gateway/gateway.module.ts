import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AppGateway } from './app.gateway';
import { GatewayService } from './gateway.service';

/** WebSocket 게이트웨이와 GatewayService를 구성하는 모듈 */
@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: { algorithm: 'HS512' },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [GatewayService, AppGateway],
  exports: [GatewayService],
})
export class GatewayModule {}
