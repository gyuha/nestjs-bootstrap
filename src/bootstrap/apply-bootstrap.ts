import { type INestApplication, VersioningType } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { HttpExceptionFilter } from "../shared/presentation/http/http-exception.filter";
import { ResponseInterceptor } from "../shared/presentation/http/response.interceptor";
import { RequestLoggerMiddleware } from "./logging/request-logger.middleware";
import { TraceIdMiddleware } from "./logging/trace-id.middleware";
import { setupSecurity } from "./security/setup-security";
import { setupSwagger } from "./swagger/setup-swagger";
import { setupValidation } from "./validation/setup-validation";

export function applyBootstrap(app: INestApplication) {
  app.setGlobalPrefix("api");
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: "1",
  });

  const traceIdMiddleware = new TraceIdMiddleware();
  const requestLoggerMiddleware = new RequestLoggerMiddleware();

  app.use(traceIdMiddleware.use.bind(traceIdMiddleware));
  app.use(requestLoggerMiddleware.use.bind(requestLoggerMiddleware));

  setupSecurity(app);
  setupValidation(app);
  setupSwagger(app);

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor(app.get(Reflector)));
}
