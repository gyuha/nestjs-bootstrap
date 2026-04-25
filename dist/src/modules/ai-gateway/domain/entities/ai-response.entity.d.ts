import { Entity } from "../../../../shared/domain/entity";
import type { TokenUsage } from "./token-usage.entity";
export interface AIResponseProps {
  id: string;
  content: string;
  usage: TokenUsage;
  model: string;
  created: number;
  latencyMs?: number;
}
export declare class AIResponse extends Entity<AIResponseProps> {
  get id(): string;
  get content(): string;
  get usage(): TokenUsage;
  get model(): string;
  get latencyMs(): number;
}
