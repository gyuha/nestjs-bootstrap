import { EmailProcessor } from './email.processor';
import { EmailService } from './email.service';

/** EmailProcessor의 단위 테스트 스위트 */
describe('EmailProcessor', () => {
  let processor: EmailProcessor;
  let mockEmailService: {
    sendSignupConfirmation: jest.Mock;
    sendWelcome: jest.Mock;
    sendLoginAlert: jest.Mock;
    sendPasswordReset: jest.Mock;
    sendSubscriptionConfirmation: jest.Mock;
    sendAccountDeactivationWarning: jest.Mock;
  };

  beforeEach(() => {
    mockEmailService = {
      sendSignupConfirmation: jest.fn().mockResolvedValue(undefined),
      sendWelcome: jest.fn().mockResolvedValue(undefined),
      sendLoginAlert: jest.fn().mockResolvedValue(undefined),
      sendPasswordReset: jest.fn().mockResolvedValue(undefined),
      sendSubscriptionConfirmation: jest.fn().mockResolvedValue(undefined),
      sendAccountDeactivationWarning: jest.fn().mockResolvedValue(undefined),
    };

    processor = new EmailProcessor(mockEmailService as any);
  });

  it('processes signup-confirmation job', async () => {
    await processor.process({
      data: {
        type: 'signup-confirmation',
        to: 'test@example.com',
        token: 'abc',
      },
    } as any);
    expect(mockEmailService.sendSignupConfirmation).toHaveBeenCalledWith(
      'test@example.com',
      'abc',
    );
  });

  it('processes welcome job', async () => {
    await processor.process({
      data: { type: 'welcome', to: 'test@example.com' },
    } as any);
    expect(mockEmailService.sendWelcome).toHaveBeenCalledWith(
      'test@example.com',
    );
  });

  it('processes login-alert job', async () => {
    await processor.process({
      data: {
        type: 'login-alert',
        to: 'test@example.com',
        ip: '1.2.3.4',
        userAgent: 'chrome',
      },
    } as any);
    expect(mockEmailService.sendLoginAlert).toHaveBeenCalledWith(
      'test@example.com',
      '1.2.3.4',
      'chrome',
    );
  });

  it('processes password-reset job', async () => {
    await processor.process({
      data: { type: 'password-reset', to: 'test@example.com', token: 'xyz' },
    } as any);
    expect(mockEmailService.sendPasswordReset).toHaveBeenCalledWith(
      'test@example.com',
      'xyz',
    );
  });

  it('processes subscription-confirm job', async () => {
    await processor.process({
      data: {
        type: 'subscription-confirm',
        to: 'test@example.com',
        token: 'sub',
      },
    } as any);
    expect(mockEmailService.sendSubscriptionConfirmation).toHaveBeenCalledWith(
      'test@example.com',
      'sub',
    );
  });

  it('processes account-deactivation job', async () => {
    await processor.process({
      data: { type: 'account-deactivation', to: 'test@example.com' },
    } as any);
    expect(
      mockEmailService.sendAccountDeactivationWarning,
    ).toHaveBeenCalledWith('test@example.com');
  });

  it('throws on unknown email type', async () => {
    await expect(
      processor.process({
        data: { type: 'unknown', to: 'test@example.com' },
      } as any),
    ).rejects.toThrow('Unknown email job type: unknown');
  });
});
