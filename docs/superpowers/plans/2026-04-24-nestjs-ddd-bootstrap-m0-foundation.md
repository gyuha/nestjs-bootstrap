# NestJS DDD Bootstrap M0 Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first executable foundation for the NestJS DDD bootstrap: Bun/NestJS/Biome project setup, config validation, Swagger, API versioning, and a base health endpoint.

**Architecture:** This plan creates the minimal app shell that M1-M6 milestones can extend vertically. Bootstrap concerns live under `src/bootstrap/*`, app composition stays in `src/app.module.ts`, and health is isolated as the first feature-style module under `src/modules/health`.

**Tech Stack:** Bun, NestJS, TypeScript, Biome, Jest, Supertest, Swagger/OpenAPI, class-validator, class-transformer.

---

## Scope Boundary

This plan implements only M0 from the approved roadmap spec. M1-M6 should each receive their own follow-up implementation plan because they include independent subsystems: shared DDD primitives, Drizzle data layer, Users, Auth, OAuth extension ports, and final test/ops hardening.

## File Structure

Create or modify these files:

- Create: `package.json` — Bun scripts and dependencies for NestJS, Swagger, validation, testing, and Biome.
- Create: `tsconfig.json` — TypeScript compiler settings for source and tests.
- Create: `tsconfig.build.json` — Build-specific TypeScript settings.
- Create: `nest-cli.json` — Nest CLI build metadata.
- Create: `biome.json` — formatter and linter configuration.
- Create: `.gitignore` — generated files, dependencies, env locals, coverage, and DB files.
- Create: `.env.example` — documented baseline environment variables.
- Create: `.env.development` — safe development defaults.
- Create: `.env.test` — safe test defaults.
- Create: `src/main.ts` — application bootstrap entrypoint.
- Create: `src/app.module.ts` — root module composition.
- Create: `src/bootstrap/config/app-config.ts` — typed environment schema and config factory.
- Create: `src/bootstrap/config/config.module.ts` — global config module wrapper.
- Create: `src/bootstrap/swagger/setup-swagger.ts` — Swagger setup.
- Create: `src/bootstrap/validation/setup-validation.ts` — global validation pipe setup.
- Create: `src/modules/health/health.module.ts` — health module.
- Create: `src/modules/health/presentation/health.controller.ts` — health endpoint controller.
- Create: `test/jest-e2e.json` — e2e Jest config.
- Create: `test/app.e2e-spec.ts` — first e2e test for `/health` and versioning.

---

### Task 1: Create Package And Tooling Config

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.build.json`
- Create: `nest-cli.json`
- Create: `biome.json`
- Create: `.gitignore`

- [ ] **Step 1: Create `package.json`**

Write this complete file:

```json
{
  "name": "nestjs-bootstrap",
  "version": "0.1.0",
  "private": true,
  "description": "NestJS DDD bootstrap project",
  "license": "UNLICENSED",
  "scripts": {
    "start": "nest start",
    "start:dev": "nest start --watch",
    "build": "nest build",
    "format": "biome format --write .",
    "format:check": "biome format .",
    "lint": "biome lint .",
    "check": "biome check .",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:e2e": "jest --config ./test/jest-e2e.json"
  },
  "dependencies": {
    "@nestjs/common": "latest",
    "@nestjs/config": "latest",
    "@nestjs/core": "latest",
    "@nestjs/platform-express": "latest",
    "@nestjs/swagger": "latest",
    "class-transformer": "latest",
    "class-validator": "latest",
    "reflect-metadata": "latest",
    "rxjs": "latest"
  },
  "devDependencies": {
    "@biomejs/biome": "latest",
    "@nestjs/cli": "latest",
    "@nestjs/schematics": "latest",
    "@nestjs/testing": "latest",
    "@types/bun": "latest",
    "@types/express": "latest",
    "@types/jest": "latest",
    "@types/node": "latest",
    "@types/supertest": "latest",
    "jest": "latest",
    "source-map-support": "latest",
    "supertest": "latest",
    "ts-jest": "latest",
    "ts-loader": "latest",
    "ts-node": "latest",
    "tsconfig-paths": "latest",
    "typescript": "latest"
  },
  "jest": {
    "moduleFileExtensions": ["js", "json", "ts"],
    "rootDir": "src",
    "testRegex": ".*\\.spec\\.ts$",
    "transform": {
      "^.+\\.(t|j)s$": "ts-jest"
    },
    "collectCoverageFrom": ["**/*.(t|j)s"],
    "coverageDirectory": "../coverage",
    "testEnvironment": "node"
  }
}
```

- [ ] **Step 2: Create TypeScript configs**

Write `tsconfig.json`:

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2022",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strict": true,
    "strictPropertyInitialization": false,
    "noImplicitAny": true,
    "strictBindCallApply": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

Write `tsconfig.build.json`:

```json
{
  "extends": "./tsconfig.json",
  "exclude": ["node_modules", "test", "dist", "**/*spec.ts"]
}
```

- [ ] **Step 3: Create Nest and Biome configs**

Write `nest-cli.json`:

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true
  }
}
```

Write `biome.json`:

```json
{
  "$schema": "https://biomejs.dev/schemas/2.2.0/schema.json",
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "semicolons": "always",
      "trailingCommas": "all"
    }
  },
  "files": {
    "includes": ["**", "!dist", "!coverage", "!node_modules", "!bun.lock"]
  }
}
```

- [ ] **Step 4: Create `.gitignore`**

Write this complete file:

```gitignore
node_modules
/dist
/coverage
.env*.local
*.sqlite
*.sqlite3
.DS_Store
bun.lockb
```

- [ ] **Step 5: Install dependencies**

Run:

```bash
bun install
```

Expected: dependencies install successfully and a Bun lockfile is created.

- [ ] **Step 6: Run initial tooling checks**

Run:

```bash
bun run check
```

Expected: Biome reports no files needing changes or only checks the newly created config files without fatal errors.

- [ ] **Step 7: Commit tooling baseline**

Run:

```bash
git add package.json tsconfig.json tsconfig.build.json nest-cli.json biome.json .gitignore bun.lock* && git commit -m "chore: configure nestjs bun tooling"
```

Expected: commit succeeds with the tooling baseline.

---

### Task 2: Add Typed Configuration

**Files:**
- Create: `.env.example`
- Create: `.env.development`
- Create: `.env.test`
- Create: `src/bootstrap/config/app-config.ts`
- Create: `src/bootstrap/config/config.module.ts`
- Modify: `src/app.module.ts`

- [ ] **Step 1: Write env files**

Write `.env.example`:

```dotenv
NODE_ENV=development
APP_NAME=nestjs-bootstrap
APP_PORT=3000
API_PREFIX=api
API_VERSION=1
SWAGGER_ENABLED=true
SWAGGER_PATH=docs
```

Write `.env.development`:

```dotenv
NODE_ENV=development
APP_NAME=nestjs-bootstrap
APP_PORT=3000
API_PREFIX=api
API_VERSION=1
SWAGGER_ENABLED=true
SWAGGER_PATH=docs
```

Write `.env.test`:

```dotenv
NODE_ENV=test
APP_NAME=nestjs-bootstrap-test
APP_PORT=3001
API_PREFIX=api
API_VERSION=1
SWAGGER_ENABLED=false
SWAGGER_PATH=docs
```

- [ ] **Step 2: Create typed config factory**

Write `src/bootstrap/config/app-config.ts`:

```ts
import { plainToInstance } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsNotEmpty, IsString, Max, Min, validateSync } from 'class-validator';

enum NodeEnvironment {
  Development = 'development',
  Test = 'test',
  Production = 'production',
}

class EnvironmentVariables {
  @IsEnum(NodeEnvironment)
  NODE_ENV!: NodeEnvironment;

  @IsString()
  @IsNotEmpty()
  APP_NAME!: string;

  @IsInt()
  @Min(1)
  @Max(65535)
  APP_PORT!: number;

  @IsString()
  @IsNotEmpty()
  API_PREFIX!: string;

  @IsString()
  @IsNotEmpty()
  API_VERSION!: string;

  @IsBoolean()
  SWAGGER_ENABLED!: boolean;

  @IsString()
  @IsNotEmpty()
  SWAGGER_PATH!: string;
}

export type AppConfig = {
  nodeEnv: NodeEnvironment;
  appName: string;
  port: number;
  apiPrefix: string;
  apiVersion: string;
  swagger: {
    enabled: boolean;
    path: string;
  };
};

export function validateEnvironment(config: Record<string, unknown>): EnvironmentVariables {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validatedConfig;
}

export default (): AppConfig => ({
  nodeEnv: process.env.NODE_ENV as NodeEnvironment,
  appName: process.env.APP_NAME ?? 'nestjs-bootstrap',
  port: Number(process.env.APP_PORT ?? 3000),
  apiPrefix: process.env.API_PREFIX ?? 'api',
  apiVersion: process.env.API_VERSION ?? '1',
  swagger: {
    enabled: process.env.SWAGGER_ENABLED === 'true',
    path: process.env.SWAGGER_PATH ?? 'docs',
  },
});
```

- [ ] **Step 3: Create global config module**

Write `src/bootstrap/config/config.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import appConfig, { validateEnvironment } from './app-config';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV ?? 'development'}.local`, `.env.${process.env.NODE_ENV ?? 'development'}`, '.env'],
      load: [appConfig],
      validate: validateEnvironment,
    }),
  ],
})
export class ConfigModule {}
```

- [ ] **Step 4: Create root app module**

Write `src/app.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { ConfigModule } from './bootstrap/config/config.module';

@Module({
  imports: [ConfigModule],
})
export class AppModule {}
```

- [ ] **Step 5: Run config-focused build check**

Run:

```bash
bun run build
```

Expected: TypeScript compilation succeeds and `dist` is created.

- [ ] **Step 6: Commit typed config**

Run:

```bash
git add .env.example .env.development .env.test src/bootstrap/config src/app.module.ts && git commit -m "feat: add typed application config"
```

Expected: commit succeeds with typed environment validation.

---

### Task 3: Add App Bootstrap, Validation, Swagger, And Versioning

**Files:**
- Create: `src/main.ts`
- Create: `src/bootstrap/swagger/setup-swagger.ts`
- Create: `src/bootstrap/validation/setup-validation.ts`

- [ ] **Step 1: Create validation setup**

Write `src/bootstrap/validation/setup-validation.ts`:

```ts
import { INestApplication, ValidationPipe } from '@nestjs/common';

export function setupValidation(app: INestApplication): void {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
}
```

- [ ] **Step 2: Create Swagger setup**

Write `src/bootstrap/swagger/setup-swagger.ts`:

```ts
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppConfig } from '../config/app-config';

export function setupSwagger(app: INestApplication): void {
  const configService = app.get(ConfigService<AppConfig, true>);
  const appName = configService.get('appName', { infer: true });
  const swagger = configService.get('swagger', { infer: true });

  if (!swagger.enabled) {
    return;
  }

  const documentConfig = new DocumentBuilder()
    .setTitle(appName)
    .setDescription('NestJS DDD Bootstrap API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, documentConfig);
  SwaggerModule.setup(swagger.path, app, document);
}
```

- [ ] **Step 3: Create main bootstrap**

Write `src/main.ts`:

```ts
import { VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppConfig } from './bootstrap/config/app-config';
import { setupSwagger } from './bootstrap/swagger/setup-swagger';
import { setupValidation } from './bootstrap/validation/setup-validation';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService<AppConfig, true>);

  const apiPrefix = configService.get('apiPrefix', { infer: true });
  const apiVersion = configService.get('apiVersion', { infer: true });
  const port = configService.get('port', { infer: true });

  app.setGlobalPrefix(apiPrefix);
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: apiVersion,
  });

  setupValidation(app);
  setupSwagger(app);

  await app.listen(port);
}

void bootstrap();
```

- [ ] **Step 4: Run build**

Run:

```bash
bun run build
```

Expected: build succeeds with no TypeScript errors.

- [ ] **Step 5: Commit bootstrap setup**

Run:

```bash
git add src/main.ts src/bootstrap/swagger src/bootstrap/validation && git commit -m "feat: add app bootstrap setup"
```

Expected: commit succeeds with app bootstrap setup.

---

### Task 4: Add Health Module And E2E Test

**Files:**
- Create: `src/modules/health/health.module.ts`
- Create: `src/modules/health/presentation/health.controller.ts`
- Modify: `src/app.module.ts`
- Create: `test/jest-e2e.json`
- Create: `test/app.e2e-spec.ts`

- [ ] **Step 1: Create health controller**

Write `src/modules/health/presentation/health.controller.ts`:

```ts
import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

export type HealthResponse = {
  status: 'ok';
};

@ApiTags('health')
@Controller({
  path: 'health',
  version: VERSION_NEUTRAL,
})
export class HealthController {
  @Get()
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
      },
      required: ['status'],
    },
  })
  getHealth(): HealthResponse {
    return { status: 'ok' };
  }
}
```

- [ ] **Step 2: Create health module**

Write `src/modules/health/health.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { HealthController } from './presentation/health.controller';

@Module({
  controllers: [HealthController],
})
export class HealthModule {}
```

- [ ] **Step 3: Register health module**

Replace `src/app.module.ts` with:

```ts
import { Module } from '@nestjs/common';
import { ConfigModule } from './bootstrap/config/config.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [ConfigModule, HealthModule],
})
export class AppModule {}
```

- [ ] **Step 4: Create e2e Jest config**

Write `test/jest-e2e.json`:

```json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": "..",
  "testEnvironment": "node",
  "testRegex": ".e2e-spec.ts$",
  "transform": {
    "^.+\\.(t|j)s$": "ts-jest"
  },
  "moduleNameMapper": {
    "^@/(.*)$": "<rootDir>/src/$1"
  }
}
```

- [ ] **Step 5: Create health e2e test**

Write `test/app.e2e-spec.ts`:

```ts
import { INestApplication, VersioningType } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { setupValidation } from '../src/bootstrap/validation/setup-validation';

describe('App health endpoint (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });
    setupValidation(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns application health without version prefix', async () => {
    await request(app.getHttpServer()).get('/api/health').expect(200).expect({ status: 'ok' });
  });
});
```

- [ ] **Step 6: Run e2e test**

Run:

```bash
bun run test:e2e
```

Expected: `App health endpoint (e2e)` passes.

- [ ] **Step 7: Commit health endpoint**

Run:

```bash
git add src/modules/health src/app.module.ts test && git commit -m "feat: add health endpoint"
```

Expected: commit succeeds with health endpoint and e2e test.

---

### Task 5: Document M0 Usage

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Replace README with M0 instructions**

Write `README.md`:

````markdown
# nestjs-bootstrap

NestJS DDD bootstrap project for building modular monolith backends with Bun.

## Current Milestone

M0 foundation is implemented:

- NestJS application shell
- Bun package scripts
- TypeScript strict mode
- Biome format/lint configuration
- typed environment validation
- URI API versioning
- Swagger setup for development
- neutral `/api/health` endpoint
- first e2e test

## Requirements

- Bun

## Install

```bash
bun install
```

## Environment

Copy the example file when creating local overrides:

```bash
cp .env.example .env.development.local
```

Default development values are already provided in `.env.development`.

| Variable | Default | Description |
| --- | --- | --- |
| `NODE_ENV` | `development` | Runtime environment |
| `APP_NAME` | `nestjs-bootstrap` | Application name used in Swagger |
| `APP_PORT` | `3000` | HTTP port |
| `API_PREFIX` | `api` | Global API prefix |
| `API_VERSION` | `1` | Default URI API version |
| `SWAGGER_ENABLED` | `true` | Enables Swagger UI |
| `SWAGGER_PATH` | `docs` | Swagger UI path |

## Run

```bash
bun run start:dev
```

Health endpoint:

```bash
curl http://localhost:3000/api/health
```

Swagger UI:

```text
http://localhost:3000/docs
```

## Checks

```bash
bun run check
bun run build
bun run test:e2e
```

## Roadmap

The approved roadmap spec is in `docs/superpowers/specs/2026-04-24-nestjs-ddd-bootstrap-roadmap-design.md`.
M1-M6 should be implemented through separate implementation plans.
````

- [ ] **Step 2: Run formatting and checks**

Run:

```bash
bun run format
bun run check
bun run build
bun run test:e2e
```

Expected: all commands pass.

- [ ] **Step 3: Commit documentation**

Run:

```bash
git add README.md && git commit -m "docs: document m0 foundation usage"
```

Expected: commit succeeds with README updates.

---

## Final Verification

- [ ] **Step 1: Check git status**

Run:

```bash
git status --short
```

Expected: no uncommitted implementation files remain.

- [ ] **Step 2: Run full M0 verification**

Run:

```bash
bun run check && bun run build && bun run test:e2e
```

Expected: Biome check, Nest build, and health e2e test all pass.

- [ ] **Step 3: Confirm manual dev server startup**

Run:

```bash
bun run start:dev
```

Expected: Nest starts on port `3000`. In a second terminal, this command returns `{"status":"ok"}`:

```bash
curl http://localhost:3000/api/health
```

Stop the dev server with `Ctrl+C` after the manual check.
