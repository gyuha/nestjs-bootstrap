import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import {
  type OnGatewayConnection,
  type OnGatewayDisconnect,
  type OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { SkipTransform } from '../../presentation/decorators/skip-transform.decorator';
import { GatewayService } from './gateway.service';

@SkipTransform()
@WebSocketGateway({ cors: { origin: '*' } })
export class AppGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server!: Server;

  constructor(
    private readonly gatewayService: GatewayService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  afterInit(server: Server): void {
    this.gatewayService.setServer(server);
  }

  handleConnection(client: Socket): void {
    const token = client.handshake.auth.token as string | undefined;
    if (!token) {
      client.disconnect();
      return;
    }
    try {
      const payload = this.jwtService.verify<{ sub: string }>(token, {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
      });
      client.data.userId = payload.sub;
      this.gatewayService.registerSocket(payload.sub, client.id);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket): void {
    const userId = client.data.userId as string | undefined;
    if (userId) {
      this.gatewayService.unregisterSocket(userId, client.id);
    }
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(client: Socket, topic: string): void {
    client.join(topic);
  }

  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(client: Socket, topic: string): void {
    client.leave(topic);
  }

  @OnEvent('user.role-assigned')
  handleRoleAssigned(payload: { userId: string; roleId: string }): void {
    this.gatewayService.sendToUser(payload.userId, 'role-assigned', payload);
  }

  @OnEvent('user.role-removed')
  handleRoleRemoved(payload: { userId: string; roleId: string }): void {
    this.gatewayService.sendToUser(payload.userId, 'role-removed', payload);
  }

  @OnEvent('auth.login')
  handleLoginEvent(payload: {
    userId: string;
    ip: string;
    userAgent: string;
  }): void {
    this.gatewayService.sendToUser(payload.userId, 'login-detected', payload);
  }
}
