import { Injectable } from "@nestjs/common";
import type { EmailOptions, EmailServiceInterface } from "./email-service.interface";

@Injectable()
export class ConsoleEmailService implements EmailServiceInterface {
  async send(options: EmailOptions): Promise<void> {
    console.log("[EMAIL] ====================================");
    console.log("[EMAIL] To:", options.to);
    console.log("[EMAIL] Subject:", options.subject);
    console.log("[EMAIL] ===================================");
    console.log(options.html);
    console.log("[EMAIL] ===================================");
  }
}
