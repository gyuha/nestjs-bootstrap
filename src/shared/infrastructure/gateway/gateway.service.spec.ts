import { Test } from '@nestjs/testing';
import { GatewayService } from './gateway.service';

describe('GatewayService', () => {
  let service: GatewayService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [GatewayService],
    }).compile();

    service = module.get(GatewayService);
  });

  const makeServer = () => {
    const emitFn = jest.fn();
    const toFn = jest.fn().mockReturnValue({ emit: emitFn });
    return { server: { to: toFn }, emitFn, toFn };
  };

  it('registers socket and sends message to user', () => {
    const { server, toFn, emitFn } = makeServer();
    service.setServer(server as any);
    service.registerSocket('user-1', 'socket-a');

    service.sendToUser('user-1', 'test-event', { hello: 'world' });

    expect(toFn).toHaveBeenCalledWith('socket-a');
    expect(emitFn).toHaveBeenCalledWith('test-event', { hello: 'world' });
  });

  it('sends to all sockets for a user with multiple connections', () => {
    const { server, toFn } = makeServer();
    service.setServer(server as any);
    service.registerSocket('user-1', 'socket-a');
    service.registerSocket('user-1', 'socket-b');

    service.sendToUser('user-1', 'event', {});

    expect(toFn).toHaveBeenCalledTimes(2);
  });

  it('does nothing when server is not set', () => {
    expect(() => service.sendToUser('user-1', 'event', {})).not.toThrow();
  });

  it('does nothing for unknown user', () => {
    const { server, toFn } = makeServer();
    service.setServer(server as any);

    service.sendToUser('unknown-user', 'event', {});

    expect(toFn).not.toHaveBeenCalled();
  });

  it('unregisters a socket and stops sending to it', () => {
    const { server, toFn } = makeServer();
    service.setServer(server as any);
    service.registerSocket('user-1', 'socket-a');
    service.unregisterSocket('user-1', 'socket-a');

    service.sendToUser('user-1', 'event', {});

    expect(toFn).not.toHaveBeenCalled();
  });

  it('sends to room', () => {
    const { server, toFn, emitFn } = makeServer();
    service.setServer(server as any);

    service.sendToRoom('room-1', 'room-event', { data: 1 });

    expect(toFn).toHaveBeenCalledWith('room-1');
    expect(emitFn).toHaveBeenCalledWith('room-event', { data: 1 });
  });
});
