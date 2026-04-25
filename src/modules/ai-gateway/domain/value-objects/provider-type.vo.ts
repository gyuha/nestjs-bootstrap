import { ValueObject } from '../../../../shared/domain/value-objects/value-object';

export enum ProviderType {
  OPENAI = 'openai',
  AZURE_OPENAI = 'azure-openai',
}

export class ProviderTypeVO extends ValueObject<ProviderType> {
  readonly value: ProviderType;

  constructor(value: ProviderType) {
    super(value);
    this.value = value;
  }
}
