import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  type OnGatewayConnection,
  type OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { SkipTransform } from '../../shared/presentation/decorators/skip-transform.decorator';

@SkipTransform()
@WebSocketGateway({ namespace: 'chat', cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  handleConnection(client: Socket): void {
    const token = client.handshake.auth.token as string | undefined;
    if (!token) {
      client.disconnect();
      return;
    }
    try {
      const payload = this.jwtService.verify<{ sub: string; email: string }>(
        token,
        {
          secret: this.config.getOrThrow<string>('JWT_SECRET'),
        },
      );
      client.data.userId = payload.sub;
      client.data.email = payload.email;
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(_client: Socket): void {}

  @SubscribeMessage('chat.join')
  handleJoin(client: Socket, room: string): void {
    client.join(room);
    client.to(room).emit('chat.joined', { userId: client.data.userId });
  }

  @SubscribeMessage('chat.leave')
  handleLeave(client: Socket, room: string): void {
    client.leave(room);
    client.to(room).emit('chat.left', { userId: client.data.userId });
  }

  @SubscribeMessage('chat.message')
  handleMessage(
    client: Socket,
    payload: { room: string; message: string },
  ): void {
    this.server.to(payload.room).emit('chat.message', {
      userId: client.data.userId,
      message: payload.message,
      timestamp: new Date().toISOString(),
    });
  }
}
