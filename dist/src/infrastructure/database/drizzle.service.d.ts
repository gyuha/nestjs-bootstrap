import { type OnModuleDestroy } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/postgres-js';
import type { EnvService } from '../../config/env.service';
export declare class DrizzleService implements OnModuleDestroy {
    private readonly sql;
    readonly db: ReturnType<typeof drizzle>;
    constructor(env: EnvService);
    onModuleDestroy(): Promise<void>;
}
