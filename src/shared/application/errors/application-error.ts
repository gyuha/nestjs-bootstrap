export enum ApplicationErrorCategory {
  NotFound = 'NOT_FOUND',
  Conflict = 'CONFLICT',
  Unauthorized = 'UNAUTHORIZED',
  Forbidden = 'FORBIDDEN',
}

export type ApplicationErrorOptions = {
  code: string;
  message: string;
  category: ApplicationErrorCategory;
  details?: unknown;
};

export class ApplicationError extends Error {
  readonly code: string;
  readonly category: ApplicationErrorCategory;
  readonly details?: unknown;

  constructor(options: ApplicationErrorOptions) {
    super(options.message);
    this.name = 'ApplicationError';
    this.code = options.code;
    this.category = options.category;
    this.details = options.details;
  }
}
