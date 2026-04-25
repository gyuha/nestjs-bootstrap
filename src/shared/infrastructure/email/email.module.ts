import { Global, Module } from "@nestjs/common";
import type { EnvService } from "../../../config/env.service";
import { ConsoleEmailService } from "./console-email.service";
import { EmailServiceInterface } from "./email-service.interface";
import { SmtpEmailService } from "./smtp-email.service";

@Global()
@Module({
  providers: [
    {
      provide: EmailServiceInterface,
      useFactory: (env: EnvService) => {
        const provider = env.get("EMAIL_PROVIDER");
        if (provider === "smtp") {
          return new SmtpEmailService(env);
        }
        return new ConsoleEmailService();
      },
      inject: [EnvService],
    },
  ],
  exports: [EmailServiceInterface],
})
export class EmailModule {}