export enum DomainErrorCategory {
  Validation = 'VALIDATION',
  Conflict = 'CONFLICT',
}

export type DomainErrorOptions = {
  code: string;
  message: string;
  category: DomainErrorCategory;
  details?: unknown;
};

export class DomainError extends Error {
  readonly code: string;
  readonly category: DomainErrorCategory;
  readonly details?: unknown;

  constructor(options: DomainErrorOptions) {
    super(options.message);
    this.name = 'DomainError';
    this.code = options.code;
    this.category = options.category;
    this.details = options.details;
  }
}
