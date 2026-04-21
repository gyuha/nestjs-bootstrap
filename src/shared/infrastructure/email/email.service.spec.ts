import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';
import { EMAIL_PROVIDER } from './email.token';
import type { IEmailProvider } from './providers/email-provider.interface';

jest.mock('./templates/signup-confirmation.email', () => ({
  renderSignupConfirmation: jest.fn().mockResolvedValue('<html>signup</html>'),
}));
jest.mock('./templates/password-reset.email', () => ({
  renderPasswordReset: jest.fn().mockResolvedValue('<html>reset</html>'),
}));
jest.mock('./templates/email-change.email', () => ({
  renderEmailChange: jest.fn().mockResolvedValue('<html>change</html>'),
}));
jest.mock('./templates/login-alert.email', () => ({
  renderLoginAlert: jest.fn().mockResolvedValue('<html>alert</html>'),
}));
jest.mock('./templates/subscription-confirm.email', () => ({
  renderSubscriptionConfirm: jest.fn().mockResolvedValue('<html>sub</html>'),
}));
jest.mock('./templates/welcome.email', () => ({
  renderWelcome: jest.fn().mockResolvedValue('<html>welcome</html>'),
}));
jest.mock('./templates/account-deactivation.email', () => ({
  renderAccountDeactivation: jest.fn().mockResolvedValue('<html>deact</html>'),
}));

describe('EmailService', () => {
  let service: EmailService;
  let mockProvider: jest.Mocked<IEmailProvider>;

  beforeEach(async () => {
    mockProvider = { send: jest.fn().mockResolvedValue(undefined) };

    const module = await Test.createTestingModule({
      providers: [
        EmailService,
        { provide: EMAIL_PROVIDER, useValue: mockProvider },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('http://localhost:3000'),
            getOrThrow: jest.fn().mockReturnValue('http://localhost:3000'),
          },
        },
      ],
    }).compile();

    service = module.get(EmailService);
  });

  describe('sendSignupConfirmation()', () => {
    it('calls provider.send with correct to and subject', async () => {
      await service.sendSignupConfirmation('user@example.com', 'token-abc');

      expect(mockProvider.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: expect.stringContaining('이메일'),
        }),
      );
    });
  });

  describe('sendPasswordReset()', () => {
    it('calls provider.send with reset subject', async () => {
      await service.sendPasswordReset('user@example.com', 'token-xyz');

      expect(mockProvider.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: expect.stringContaining('비밀번호'),
        }),
      );
    });
  });

  describe('sendLoginAlert()', () => {
    it('calls provider.send with login alert subject', async () => {
      await service.sendLoginAlert('user@example.com', '127.0.0.1', 'Mozilla/5.0');

      expect(mockProvider.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: expect.stringContaining('로그인'),
        }),
      );
    });
  });

  describe('sendWelcome()', () => {
    it('calls provider.send with welcome subject', async () => {
      await service.sendWelcome('user@example.com');

      expect(mockProvider.send).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'user@example.com' }),
      );
    });
  });

  describe('error handling', () => {
    it('does not throw when provider.send fails', async () => {
      mockProvider.send.mockRejectedValue(new Error('SMTP error'));

      await expect(service.sendWelcome('user@example.com')).resolves.not.toThrow();
    });
  });
});
