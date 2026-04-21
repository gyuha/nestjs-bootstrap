import { Test } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { DRIZZLE_CLIENT } from '../database/database.token';

describe('AuditService', () => {
  let service: AuditService;
  // biome-ignore lint/suspicious/noExplicitAny: mock db
  let mockDb: any;

  beforeEach(async () => {
    mockDb = {
      insert: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: DRIZZLE_CLIENT, useValue: mockDb },
      ],
    }).compile();

    service = module.get(AuditService);
  });

  it('inserts an audit log entry', async () => {
    const mockValues = jest.fn().mockResolvedValue(undefined);
    mockDb.insert.mockReturnValue({ values: mockValues });

    await service.log({
      userId: 'user-1',
      action: 'auth.login',
      ip: '127.0.0.1',
      userAgent: 'Mozilla/5.0',
    });

    expect(mockDb.insert).toHaveBeenCalled();
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'auth.login', ip: '127.0.0.1' }),
    );
  });

  it('handles null userId for unauthenticated events', async () => {
    const mockValues = jest.fn().mockResolvedValue(undefined);
    mockDb.insert.mockReturnValue({ values: mockValues });

    await service.log({ userId: null, action: 'auth.login' });

    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({ userId: null }),
    );
  });

  it('serializes metadata to JSON string', async () => {
    const mockValues = jest.fn().mockResolvedValue(undefined);
    mockDb.insert.mockReturnValue({ values: mockValues });

    await service.log({
      userId: 'user-1',
      action: 'user.role-assigned',
      metadata: { roleId: 'role-1' },
    });

    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({ metadata: '{"roleId":"role-1"}' }),
    );
  });
});
