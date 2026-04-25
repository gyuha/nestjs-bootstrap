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
exports.TraceIdInterceptor = exports.TRACE_ID_HEADER = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
exports.TRACE_ID_HEADER = "x-trace-id";
let TraceIdInterceptor = class TraceIdInterceptor {
  intercept(context, next) {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const traceId = request.headers[exports.TRACE_ID_HEADER] || (0, uuid_1.v4)();
    request.traceId = traceId;
    response.setHeader(exports.TRACE_ID_HEADER, traceId);
    return next.handle();
  }
};
exports.TraceIdInterceptor = TraceIdInterceptor;
exports.TraceIdInterceptor = TraceIdInterceptor = __decorate(
  [(0, common_1.Injectable)()],
  TraceIdInterceptor,
);
//# sourceMappingURL=trace-id.interceptor.js.map
