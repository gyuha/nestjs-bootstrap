import { Entity } from '../../../../shared/domain/entity';
import type { TokenUsage } from './token-usage.entity';

export interface AIResponseProps {
  id: string;
  content: string;
  usage: TokenUsage;
  model: string;
  created: number;
  latencyMs?: number;
}

export class AIResponse extends Entity<AIResponseProps> {
  get id(): string {
    return this.props.id;
  }

  get content(): string {
    return this.props.content;
  }

  get usage(): TokenUsage {
    return this.props.usage;
  }

  get model(): string {
    return this.props.model;
  }

  get latencyMs(): number {
    return this.props.latencyMs ?? 0;
  }
}
