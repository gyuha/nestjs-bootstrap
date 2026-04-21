import { Injectable } from '@nestjs/common';
import type { Server } from 'socket.io';

@Injectable()
export class GatewayService {
  private server: Server | null = null;
  private readonly userSockets = new Map<string, Set<string>>();

  setServer(server: Server): void {
    this.server = server;
  }

  registerSocket(userId: string, socketId: string): void {
    const sockets = this.userSockets.get(userId) ?? new Set<string>();
    sockets.add(socketId);
    this.userSockets.set(userId, sockets);
  }

  unregisterSocket(userId: string, socketId: string): void {
    const sockets = this.userSockets.get(userId);
    if (!sockets) return;
    sockets.delete(socketId);
    if (sockets.size === 0) this.userSockets.delete(userId);
  }

  sendToUser(userId: string, event: string, data: unknown): void {
    if (!this.server) return;
    const sockets = this.userSockets.get(userId);
    if (!sockets) return;
    for (const socketId of sockets) {
      this.server.to(socketId).emit(event, data);
    }
  }

  sendToRoom(room: string, event: string, data: unknown): void {
    this.server?.to(room).emit(event, data);
  }
}
