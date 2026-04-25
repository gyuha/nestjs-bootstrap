export abstract class Entity<T> {
  constructor(protected readonly props: T) {}

  equals(entity?: Entity<T>): boolean {
    if (entity === null || entity === undefined) {
      return false;
    }
    return this === entity;
  }
}
