import { ValueObject } from '../../../../shared/domain/value-objects/value-object';

export class ModelId extends ValueObject<string> {
  readonly value: string;

  constructor(value: string) {
    super(value);
    this.value = value;
  }
}
