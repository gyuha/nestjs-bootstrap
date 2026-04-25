import { Global, Module } from "@nestjs/common";
import { EnvService } from "../../../config/env.service";
import { ConsoleEmailService } from "./console-email.service";
import { SmtpEmailService } from "./smtp-email.service";

const EMAIL_SERVICE = "EMAIL_SERVICE";

@Global()
@Module({
  providers: [
    {
      provide: EMAIL_SERVICE,
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
  exports: [EMAIL_SERVICE],
})
export class EmailModule {}
