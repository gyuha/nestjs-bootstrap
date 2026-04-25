import type { EnvService } from "../../../config/env.service";
import type { EmailOptions, EmailServiceInterface } from "./email-service.interface";
export declare class SmtpEmailService implements EmailServiceInterface {
    private readonly env;
    private transporter;
    constructor(env: EnvService);
    send(options: EmailOptions): Promise<void>;
}
