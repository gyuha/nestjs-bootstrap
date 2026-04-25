import { Entity } from "../../../../shared/domain/entity";
export interface TokenUsageProps {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostCents?: number;
}
export declare class TokenUsage extends Entity<TokenUsageProps> {
  get promptTokens(): number;
  get completionTokens(): number;
  get totalTokens(): number;
  get estimatedCostCents(): number | undefined;
}
