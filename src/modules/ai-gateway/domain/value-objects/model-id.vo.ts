import { ValueObject } from "../../../../shared/domain/value-objects/value-object";

export class ModelId extends ValueObject<string> {
  readonly value: string;
}
