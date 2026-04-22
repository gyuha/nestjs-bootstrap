import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { ChatGateway } from './chat.gateway';

describe('ChatGateway', () => {
  let gateway: ChatGateway;
  let mockJwtService: { verify: jest.Mock };

  beforeEach(async () => {
    mockJwtService = { verify: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        ChatGateway,
        { provide: JwtService, useValue: mockJwtService },
        {
          provide: ConfigService,
          useValue: { getOrThrow: jest.fn().mockReturnValue('test-secret') },
        },
      ],
    }).compile();

    gateway = module.get(ChatGateway);
  });

  const createClient = (token?: string) => ({
    handshake: { auth: { token } },
    data: {} as Record<string, unknown>,
    id: 'socket-id',
    disconnect: jest.fn(),
    join: jest.fn(),
    leave: jest.fn(),
    to: jest.fn().mockReturnValue({ emit: jest.fn() }),
  });

  it('disconnects client with no token', () => {
    const client = createClient();
    // biome-ignore lint/suspicious/noExplicitAny: socket mock
    gateway.handleConnection(client as any);
    expect(client.disconnect).toHaveBeenCalled();
  });

  it('disconnects client with invalid token', () => {
    mockJwtService.verify.mockImplementation(() => {
      throw new Error('invalid');
    });
    const client = createClient('bad');
    // biome-ignore lint/suspicious/noExplicitAny: socket mock
    gateway.handleConnection(client as any);
    expect(client.disconnect).toHaveBeenCalled();
  });

  it('authenticates valid client', () => {
    mockJwtService.verify.mockReturnValue({
      sub: 'user-1',
      email: 'u@example.com',
    });
    const client = createClient('valid-token');
    // biome-ignore lint/suspicious/noExplicitAny: socket mock
    gateway.handleConnection(client as any);
    expect(client.data.userId).toBe('user-1');
    expect(client.disconnect).not.toHaveBeenCalled();
  });

  it('joins a chat room', () => {
    const client = createClient();
    client.data.userId = 'user-1';
    // biome-ignore lint/suspicious/noExplicitAny: socket mock
    gateway.handleJoin(client as any, 'room-1');
    expect(client.join).toHaveBeenCalledWith('room-1');
  });

  it('leaves a chat room', () => {
    const client = createClient();
    client.data.userId = 'user-1';
    // biome-ignore lint/suspicious/noExplicitAny: socket mock
    gateway.handleLeave(client as any, 'room-1');
    expect(client.leave).toHaveBeenCalledWith('room-1');
  });

  it('broadcasts chat message to room', () => {
    const emitFn = jest.fn();
    const toFn = jest.fn().mockReturnValue({ emit: emitFn });
    const mockServer = { to: toFn };
    // biome-ignore lint/suspicious/noExplicitAny: mock server
    gateway.server = mockServer as any;

    const client = createClient();
    client.data.userId = 'user-1';
    // biome-ignore lint/suspicious/noExplicitAny: socket mock
    gateway.handleMessage(client as any, { room: 'room-1', message: 'Hello!' });

    expect(toFn).toHaveBeenCalledWith('room-1');
    expect(emitFn).toHaveBeenCalledWith(
      'chat.message',
      expect.objectContaining({ userId: 'user-1', message: 'Hello!' }),
    );
  });
});
