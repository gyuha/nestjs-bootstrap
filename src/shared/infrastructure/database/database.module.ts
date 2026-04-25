import { Global, Module } from "@nestjs/common";
import { databaseProvider, postgresPoolProvider } from "./database.provider";

@Global()
@Module({
  providers: [postgresPoolProvider, databaseProvider],
  exports: [postgresPoolProvider, databaseProvider],
})
export class DatabaseModule {}
