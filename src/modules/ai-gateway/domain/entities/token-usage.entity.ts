import { Entity } from '../../../../shared/domain/entity';

export interface TokenUsageProps {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostCents?: number;
}

export class TokenUsage extends Entity<TokenUsageProps> {
  get promptTokens(): number {
    return this.props.promptTokens;
  }

  get completionTokens(): number {
    return this.props.completionTokens;
  }

  get totalTokens(): number {
    return this.props.totalTokens;
  }

  get estimatedCostCents(): number | undefined {
    return this.props.estimatedCostCents;
  }
}
