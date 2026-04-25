import { Global, Module } from "@nestjs/common";
import {
  databaseProvider,
  postgresPoolProvider,
  postgresPoolServiceProvider,
} from "./database.provider";

@Global()
@Module({
  providers: [postgresPoolServiceProvider, postgresPoolProvider, databaseProvider],
  exports: [postgresPoolProvider, databaseProvider],
})
export class DatabaseModule {}
