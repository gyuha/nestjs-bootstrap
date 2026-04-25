import { Global, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { envConfig } from "./env.config";
import { EnvService } from "./env.service";

@Global()
@Module({
  imports: [ConfigModule.forRoot({ load: [envConfig], isGlobal: true })],
  providers: [EnvService],
  exports: [EnvService],
})
export class ConfigModule_ {}
