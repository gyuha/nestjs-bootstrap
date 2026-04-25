import type { INestApplication } from '@nestjs/common';
import type { EnvService } from '../../config/env.service';
export declare function setupSecurity(app: INestApplication, env: EnvService): void;
