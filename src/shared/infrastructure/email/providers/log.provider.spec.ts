import { LogProvider } from './log.provider';

describe('LogProvider', () => {
  let provider: LogProvider;

  beforeEach(() => {
    provider = new LogProvider();
  });

  it('logs email details to console without throwing', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await expect(
      provider.send({
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Hello</p>',
      }),
    ).resolves.not.toThrow();

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('accepts array of recipients', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await expect(
      provider.send({
        to: ['a@example.com', 'b@example.com'],
        subject: 'Bulk',
        html: '<p>Hi</p>',
      }),
    ).resolves.not.toThrow();

    consoleSpy.mockRestore();
  });

  it('truncates html longer than 200 characters in log output', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const longHtml = '<p>' + 'a'.repeat(300) + '</p>';

    await provider.send({
      to: 'x@example.com',
      subject: 'Long',
      html: longHtml,
    });

    const logged = (consoleSpy.mock.calls[0] as [string, { html: string }])[1];
    expect(logged.html.endsWith('...')).toBe(true);
    consoleSpy.mockRestore();
  });
});
