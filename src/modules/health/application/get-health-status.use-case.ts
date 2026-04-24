import { Injectable } from '@nestjs/common';

export type HealthStatus = {
  status: 'ok';
};

@Injectable()
export class GetHealthStatusUseCase {
  execute(): HealthStatus {
    return { status: 'ok' };
  }
}
