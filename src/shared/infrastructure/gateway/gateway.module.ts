import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { GatewayService } from './gateway.service';
import { AppGateway } from './app.gateway';

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
