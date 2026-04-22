import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';

const mockSendMail = jest.fn();

jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: mockSendMail,
  }),
}));

describe('SmtpProvider', () => {
  let SmtpProvider: typeof import('./smtp.provider').SmtpProvider;
  let provider: InstanceType<typeof SmtpProvider>;

  beforeEach(async () => {
    mockSendMail.mockReset();
    ({ SmtpProvider } = await import('./smtp.provider'));

    const module = await Test.createTestingModule({
      providers: [
        SmtpProvider,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              const values: Record<string, unknown> = {
                SMTP_HOST: 'smtp.example.com',
                SMTP_PORT: 587,
                SMTP_USER: 'user',
                SMTP_PASS: 'pass',
                SMTP_SECURE: false,
                EMAIL_FROM: 'noreply@example.com',
              };
              return values[key];
            }),
          },
        },
      ],
    }).compile();

    provider = module.get(SmtpProvider);
  });

  it('sends email via nodemailer', async () => {
    mockSendMail.mockResolvedValue({ messageId: 'msg-1' });

    await provider.send({
      to: 'user@example.com',
      subject: 'Test',
      html: '<p>Hi</p>',
    });

    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'noreply@example.com',
        to: 'user@example.com',
        subject: 'Test',
        html: '<p>Hi</p>',
      }),
    );
  });

  it('throws on smtp error', async () => {
    mockSendMail.mockRejectedValue(new Error('Connection refused'));

    await expect(
      provider.send({
        to: 'user@example.com',
        subject: 'Test',
        html: '<p>Hi</p>',
      }),
    ).rejects.toThrow('Connection refused');
  });
});
