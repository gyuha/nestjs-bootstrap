// src/shared/decorators/validation/is-slug.decorator.ts
import {
  type ValidationArguments,
  type ValidationOptions,
  registerDecorator,
} from 'class-validator';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function IsSlug(options?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'isSlug',
      target: object.constructor,
      propertyName,
      options,
      validator: {
        validate(value: unknown, _args: ValidationArguments) {
          return typeof value === 'string' && SLUG_PATTERN.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid slug (lowercase letters, numbers, hyphens)`;
        },
      },
    });
  };
}
