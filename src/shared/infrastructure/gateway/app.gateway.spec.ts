import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { AppGateway } from './app.gateway';
import { GatewayService } from './gateway.service';

describe('AppGateway', () => {
  let gateway: AppGateway;
  let mockGatewayService: {
    setServer: jest.Mock;
    registerSocket: jest.Mock;
    unregisterSocket: jest.Mock;
    sendToUser: jest.Mock;
  };
  let mockJwtService: { verify: jest.Mock };

  beforeEach(async () => {
    mockGatewayService = {
      setServer: jest.fn(),
      registerSocket: jest.fn(),
      unregisterSocket: jest.fn(),
      sendToUser: jest.fn(),
    };
    mockJwtService = { verify: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        AppGateway,
        { provide: GatewayService, useValue: mockGatewayService },
        { provide: JwtService, useValue: mockJwtService },
        {
          provide: ConfigService,
          useValue: { getOrThrow: jest.fn().mockReturnValue('test-secret') },
        },
      ],
    }).compile();

    gateway = module.get(AppGateway);
  });

  const createClient = (token?: string) => ({
    handshake: { auth: { token } },
    data: {} as Record<string, unknown>,
    id: 'socket-id',
    disconnect: jest.fn(),
    join: jest.fn(),
    leave: jest.fn(),
  });

  it('disconnects client with no token', () => {
    const client = createClient();
    gateway.handleConnection(client as any);
    expect(client.disconnect).toHaveBeenCalled();
  });

  it('disconnects client with invalid token', () => {
    mockJwtService.verify.mockImplementation(() => {
      throw new Error('invalid');
    });
    const client = createClient('bad-token');
    gateway.handleConnection(client as any);
    expect(client.disconnect).toHaveBeenCalled();
  });

  it('registers authenticated client', () => {
    mockJwtService.verify.mockReturnValue({ sub: 'user-1' });
    const client = createClient('valid-token');
    gateway.handleConnection(client as any);
    expect(mockGatewayService.registerSocket).toHaveBeenCalledWith(
      'user-1',
      'socket-id',
    );
    expect(client.data.userId).toBe('user-1');
  });

  it('unregisters on disconnect', () => {
    const client = createClient();
    client.data.userId = 'user-1';
    gateway.handleDisconnect(client as any);
    expect(mockGatewayService.unregisterSocket).toHaveBeenCalledWith(
      'user-1',
      'socket-id',
    );
  });

  it('joins room on subscribe', () => {
    const client = createClient();
    gateway.handleSubscribe(client as any, 'my-topic');
    expect(client.join).toHaveBeenCalledWith('my-topic');
  });

  it('leaves room on unsubscribe', () => {
    const client = createClient();
    gateway.handleUnsubscribe(client as any, 'my-topic');
    expect(client.leave).toHaveBeenCalledWith('my-topic');
  });

  it('forwards role-assigned event to user via WS', () => {
    gateway.handleRoleAssigned({ userId: 'user-1', roleId: 'role-1' });
    expect(mockGatewayService.sendToUser).toHaveBeenCalledWith(
      'user-1',
      'role-assigned',
      { userId: 'user-1', roleId: 'role-1' },
    );
  });

  it('forwards role-removed event to user via WS', () => {
    gateway.handleRoleRemoved({ userId: 'user-1', roleId: 'role-1' });
    expect(mockGatewayService.sendToUser).toHaveBeenCalledWith(
      'user-1',
      'role-removed',
      { userId: 'user-1', roleId: 'role-1' },
    );
  });

  it('forwards login-detected event to user via WS', () => {
    gateway.handleLoginEvent({
      userId: 'user-1',
      ip: '127.0.0.1',
      userAgent: 'Mozilla',
    });
    expect(mockGatewayService.sendToUser).toHaveBeenCalledWith(
      'user-1',
      'login-detected',
      { userId: 'user-1', ip: '127.0.0.1', userAgent: 'Mozilla' },
    );
  });
});
