import { type INestApplication } from "@nestjs/common";
export declare const API_VERSION = "v1";
export declare const API_VERSION_PREFIX = "api/v1";
export declare function setupApiVersioning(app: INestApplication): void;
