import { ValueObject } from '../../../../shared/domain/value-objects/value-object';

export enum ProviderType {
  OPENAI = 'openai',
  AZURE_OPENAI = 'azure-openai',
}

export class ProviderTypeVO extends ValueObject<ProviderType> {
  readonly value: ProviderType;

  constructor(value: string) {
    if (!Object.values(ProviderType).includes(value as ProviderType)) {
      throw new Error(`Invalid provider type: ${value}`);
    }
    const enumValue = value as ProviderType;
    super(enumValue);
    this.value = enumValue;
  }
}
