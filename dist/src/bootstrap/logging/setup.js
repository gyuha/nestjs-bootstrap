"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupLogging = setupLogging;
const trace_id_interceptor_1 = require("../../shared/presentation/interceptors/trace-id.interceptor");
const logging_interceptor_1 = require("../../shared/presentation/interceptors/logging.interceptor");
const http_exception_filter_1 = require("../../shared/presentation/filters/http-exception.filter");
function setupLogging(app) {
    app.useGlobalInterceptors(new trace_id_interceptor_1.TraceIdInterceptor(), new logging_interceptor_1.LoggingInterceptor());
    app.useGlobalFilters(new http_exception_filter_1.GlobalExceptionFilter());
}
//# sourceMappingURL=setup.js.map