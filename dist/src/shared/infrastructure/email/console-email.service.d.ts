import type { EmailOptions, EmailServiceInterface } from "./email-service.interface";
export declare class ConsoleEmailService implements EmailServiceInterface {
    send(options: EmailOptions): Promise<void>;
}
