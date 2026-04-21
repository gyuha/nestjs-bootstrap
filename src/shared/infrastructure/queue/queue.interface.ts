export type EmailJobType =
  | 'signup-confirmation'
  | 'welcome'
  | 'login-alert'
  | 'password-reset'
  | 'email-change'
  | 'subscription-confirm'
  | 'account-deactivation';

export interface EmailJobData {
  type: EmailJobType;
  to: string;
  token?: string;
  ip?: string;
  userAgent?: string;
}
