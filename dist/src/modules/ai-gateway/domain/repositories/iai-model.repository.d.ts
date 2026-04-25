import type { ProviderType } from "../value-objects/provider-type.vo";
export interface ModelDefinition {
  id: string;
  provider: string;
  name: string;
  contextWindow: number;
}
export interface IAIModelRepository {
  findById(id: string): Promise<ModelDefinition | null>;
  findByProvider(provider: ProviderType): Promise<ModelDefinition[]>;
}
