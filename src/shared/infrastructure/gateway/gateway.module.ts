import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AppGateway } from './app.gateway';
import { GatewayService } from './gateway.service';

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
