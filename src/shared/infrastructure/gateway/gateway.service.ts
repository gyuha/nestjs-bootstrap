import { Injectable } from '@nestjs/common';
import type { Server } from 'socket.io';

/** Socket.IO 서버 인스턴스를 관리하고 사용자별 소켓 목록을 추적하는 서비스 */
@Injectable()
export class GatewayService {
  private server: Server | null = null;
  private readonly userSockets = new Map<string, Set<string>>();

  /** Socket.IO 서버 인스턴스를 서비스에 등록한다.
   * @param server Socket.IO 서버 인스턴스
   */
  setServer(server: Server): void {
    this.server = server;
  }

  /** 사용자 ID와 소켓 ID를 매핑하여 등록한다.
   * @param userId 사용자 ID
   * @param socketId 등록할 소켓 ID
   */
  registerSocket(userId: string, socketId: string): void {
    const sockets = this.userSockets.get(userId) ?? new Set<string>();
    sockets.add(socketId);
    this.userSockets.set(userId, sockets);
  }

  /** 사용자 ID와 소켓 ID 매핑을 해제한다.
   * @param userId 사용자 ID
   * @param socketId 해제할 소켓 ID
   */
  unregisterSocket(userId: string, socketId: string): void {
    const sockets = this.userSockets.get(userId);
    if (!sockets) return;
    sockets.delete(socketId);
    if (sockets.size === 0) this.userSockets.delete(userId);
  }

  /** 특정 사용자의 모든 소켓에 이벤트를 전송한다.
   * @param userId 이벤트를 받을 사용자 ID
   * @param event 이벤트 이름
   * @param data 전송할 데이터
   */
  sendToUser(userId: string, event: string, data: unknown): void {
    if (!this.server) return;
    const sockets = this.userSockets.get(userId);
    if (!sockets) return;
    for (const socketId of sockets) {
      this.server.to(socketId).emit(event, data);
    }
  }

  /** 특정 룸의 모든 소켓에 이벤트를 전송한다.
   * @param room 룸 이름
   * @param event 이벤트 이름
   * @param data 전송할 데이터
   */
  sendToRoom(room: string, event: string, data: unknown): void {
    this.server?.to(room).emit(event, data);
  }
}
