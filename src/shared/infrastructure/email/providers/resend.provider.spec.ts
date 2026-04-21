import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ResendProvider } from './resend.provider';

const mockResendClient = {
  emails: {
    send: jest.fn(),
  },
};

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => mockResendClient),
}));

describe('ResendProvider', () => {
  let provider: ResendProvider;

  beforeEach(async () => {
    mockResendClient.emails.send.mockReset();

    const module = await Test.createTestingModule({
      providers: [
        ResendProvider,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn().mockImplementation((key: string) => {
              if (key === 'RESEND_API_KEY') return 're_test_key';
              if (key === 'EMAIL_FROM') return 'noreply@example.com';
              throw new Error(`Unknown key: ${key}`);
            }),
          },
        },
      ],
    }).compile();

    provider = module.get(ResendProvider);
  });

  it('sends email via Resend SDK', async () => {
    mockResendClient.emails.send.mockResolvedValue({ data: { id: 'msg-1' }, error: null });

    await provider.send({
      to: 'user@example.com',
      subject: 'Hello',
      html: '<p>Hi</p>',
    });

    expect(mockResendClient.emails.send).toHaveBeenCalledWith({
      from: 'noreply@example.com',
      to: 'user@example.com',
      subject: 'Hello',
      html: '<p>Hi</p>',
    });
  });

  it('throws on Resend error', async () => {
    mockResendClient.emails.send.mockResolvedValue({
      data: null,
      error: { message: 'Invalid API key' },
    });

    await expect(provider.send({
      to: 'user@example.com',
      subject: 'Hello',
      html: '<p>Hi</p>',
    })).rejects.toThrow('Email delivery failed: Invalid API key');
  });
});
