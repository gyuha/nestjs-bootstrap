import { forwardRef, Module } from "@nestjs/common";
import { DrizzleUserRepository } from "./infrastructure/repository/drizzle-user.repository";
import { DrizzleModule } from "../../infrastructure/database/drizzle.module";
import { UsersApplicationService } from "./application/users-application.service";
import { UsersController } from "./presentation/users.controller";
import { AuthModule } from "../auth/infrastructure/auth.module";

const USER_REPOSITORY = "USER_REPOSITORY";

@Module({
  imports: [DrizzleModule, forwardRef(() => AuthModule)],
  providers: [
    { provide: USER_REPOSITORY, useClass: DrizzleUserRepository },
    UsersApplicationService,
  ],
  controllers: [UsersController],
  exports: [USER_REPOSITORY],
})
export class UsersModule {}
