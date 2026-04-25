"use strict";
var __decorate =
  (this && this.__decorate) ||
  function (decorators, target, key, desc) {
    var c = arguments.length,
      r =
        c < 3
          ? target
          : desc === null
            ? (desc = Object.getOwnPropertyDescriptor(target, key))
            : desc,
      d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
      r = Reflect.decorate(decorators, target, key, desc);
    else
      for (var i = decorators.length - 1; i >= 0; i--)
        if ((d = decorators[i]))
          r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersModule = void 0;
const common_1 = require("@nestjs/common");
const drizzle_user_repository_1 = require("./infrastructure/repository/drizzle-user.repository");
const drizzle_module_1 = require("../../infrastructure/database/drizzle.module");
const users_application_service_1 = require("./application/users-application.service");
const users_controller_1 = require("./presentation/users.controller");
const auth_module_1 = require("../auth/infrastructure/auth.module");
const USER_REPOSITORY = "USER_REPOSITORY";
let UsersModule = class UsersModule {};
exports.UsersModule = UsersModule;
exports.UsersModule = UsersModule = __decorate(
  [
    (0, common_1.Module)({
      imports: [drizzle_module_1.DrizzleModule, auth_module_1.AuthModule],
      providers: [
        { provide: USER_REPOSITORY, useClass: drizzle_user_repository_1.DrizzleUserRepository },
        users_application_service_1.UsersApplicationService,
      ],
      controllers: [users_controller_1.UsersController],
      exports: [USER_REPOSITORY],
    }),
  ],
  UsersModule,
);
//# sourceMappingURL=users.module.js.map
