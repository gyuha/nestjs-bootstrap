export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailServiceInterface {
  send(options: EmailOptions): Promise<void>;
}
