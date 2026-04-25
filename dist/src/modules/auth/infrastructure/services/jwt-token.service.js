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
var __metadata =
  (this && this.__metadata) ||
  function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function")
      return Reflect.metadata(k, v);
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtTokenService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const uuid_1 = require("uuid");
let JwtTokenService = class JwtTokenService {
  constructor(jwt, env) {
    this.jwt = jwt;
    this.env = env;
  }
  generateAccessToken(userId, email, role) {
    const options = {
      secret: this.env.get("JWT_SECRET"),
      expiresIn: 900,
    };
    return this.jwt.sign({ sub: userId, email, role }, options);
  }
  verifyAccessToken(token) {
    return this.jwt.verify(token, { secret: this.env.get("JWT_SECRET") });
  }
  generateRefreshToken() {
    return (0, uuid_1.v4)() + "-" + (0, crypto_1.randomBytes)(32).toString("hex");
  }
  hashToken(token) {
    return (0, crypto_1.createHash)("sha256").update(token).digest("hex");
  }
  async generateTokenPair(userId, email, role) {
    const accessToken = this.generateAccessToken(userId, email, role);
    const refreshToken = this.generateRefreshToken();
    return { accessToken, refreshToken };
  }
};
exports.JwtTokenService = JwtTokenService;
exports.JwtTokenService = JwtTokenService = __decorate(
  [(0, common_1.Injectable)(), __metadata("design:paramtypes", [Function, Function])],
  JwtTokenService,
);
//# sourceMappingURL=jwt-token.service.js.map
