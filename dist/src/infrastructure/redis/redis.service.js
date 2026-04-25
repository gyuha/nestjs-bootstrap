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
exports.RedisService = void 0;
const common_1 = require("@nestjs/common");
const ioredis_1 = require("ioredis");
let RedisService = class RedisService {
  constructor(env) {
    const url = env.get("REDIS_URL");
    this.client = new ioredis_1.default(url);
  }
  async get(key) {
    return this.client.get(key);
  }
  async set(key, value, ttlSeconds) {
    if (ttlSeconds) {
      await this.client.setex(key, ttlSeconds, value);
    } else {
      await this.client.set(key, value);
    }
  }
  async del(key) {
    await this.client.del(key);
  }
  async exists(key) {
    const result = await this.client.exists(key);
    return result === 1;
  }
  async onModuleDestroy() {
    await this.client.quit();
  }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = __decorate(
  [(0, common_1.Injectable)(), __metadata("design:paramtypes", [Function])],
  RedisService,
);
//# sourceMappingURL=redis.service.js.map
