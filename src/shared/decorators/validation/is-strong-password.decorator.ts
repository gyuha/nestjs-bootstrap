// src/shared/decorators/validation/is-strong-password.decorator.ts
import {
  type ValidationArguments,
  type ValidationOptions,
  registerDecorator,
} from 'class-validator';

export function IsStrongPassword(options?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'isStrongPassword',
      target: object.constructor,
      propertyName,
      options,
      validator: {
        validate(value: unknown, _args: ValidationArguments) {
          if (typeof value !== 'string') return false;
          return (
            value.length >= 8 &&
            /\d/.test(value) &&
            /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(value)
          );
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be at least 8 characters and contain at least 1 number and 1 special character`;
        },
      },
    });
  };
}
