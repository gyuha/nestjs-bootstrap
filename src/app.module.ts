import { Module } from "@nestjs/common";
import { AppConfigModule } from "./bootstrap/config/config.module";

@Module({
  imports: [AppConfigModule],
})
export class AppModule {}
