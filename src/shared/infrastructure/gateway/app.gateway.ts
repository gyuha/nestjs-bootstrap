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

/** JWT 인증 기반 WebSocket 연결 관리 및 실시간 이벤트 브로드캐스트를 담당하는 게이트웨이 */
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

  /** 게이트웨이 초기화 시 서버 인스턴스를 GatewayService에 등록한다.
   * @param server Socket.IO 서버 인스턴스
   */
  afterInit(server: Server): void {
    this.gatewayService.setServer(server);
  }

  /** 클라이언트 연결 시 JWT 토큰을 검증하고 소켓을 등록한다.
   * @param client 연결된 Socket.IO 클라이언트
   */
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

  /** 클라이언트 연결 해제 시 소켓 등록을 해제한다.
   * @param client 연결이 끊긴 Socket.IO 클라이언트
   */
  handleDisconnect(client: Socket): void {
    const userId = client.data.userId as string | undefined;
    if (userId) {
      this.gatewayService.unregisterSocket(userId, client.id);
    }
  }

  /** 클라이언트가 특정 토픽 룸에 참여하도록 처리한다.
   * @param client Socket.IO 클라이언트
   * @param topic 참여할 룸 이름
   */
  @SubscribeMessage('subscribe')
  handleSubscribe(client: Socket, topic: string): void {
    client.join(topic);
  }

  /** 클라이언트가 특정 토픽 룸에서 나가도록 처리한다.
   * @param client Socket.IO 클라이언트
   * @param topic 떠날 룸 이름
   */
  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(client: Socket, topic: string): void {
    client.leave(topic);
  }

  /** user.role-assigned 이벤트를 해당 사용자의 WebSocket으로 전달한다.
   * @param payload 역할 할당 이벤트 페이로드 (userId, roleId)
   */
  @OnEvent('user.role-assigned')
  handleRoleAssigned(payload: { userId: string; roleId: string }): void {
    this.gatewayService.sendToUser(payload.userId, 'role-assigned', payload);
  }

  /** user.role-removed 이벤트를 해당 사용자의 WebSocket으로 전달한다.
   * @param payload 역할 제거 이벤트 페이로드 (userId, roleId)
   */
  @OnEvent('user.role-removed')
  handleRoleRemoved(payload: { userId: string; roleId: string }): void {
    this.gatewayService.sendToUser(payload.userId, 'role-removed', payload);
  }

  /** auth.login 이벤트를 해당 사용자의 WebSocket으로 전달한다.
   * @param payload 로그인 이벤트 페이로드 (userId, ip, userAgent)
   */
  @OnEvent('auth.login')
  handleLoginEvent(payload: {
    userId: string;
    ip: string;
    userAgent: string;
  }): void {
    this.gatewayService.sendToUser(payload.userId, 'login-detected', payload);
  }
}
