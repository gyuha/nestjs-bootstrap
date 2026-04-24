/** 이메일 발송 시 전달하는 옵션 구조 */
export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

/** 이메일 발송 기능을 추상화한 인터페이스 */
export interface IEmailProvider {
  /** 이메일을 발송한다.
   * @param options 수신자, 제목, 본문 등 이메일 옵션
   */
  send(options: SendEmailOptions): Promise<void>;
}
