import { ValueObject } from "../../../../shared/domain/value-objects/value-object";
export declare enum ProviderType {
  OPENAI = "openai",
  AZURE_OPENAI = "azure-openai",
}
export declare class ProviderTypeVO extends ValueObject<ProviderType> {
  readonly value: ProviderType;
  constructor(value: ProviderType);
}
