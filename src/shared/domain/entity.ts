export abstract class Entity<T> {
  constructor(protected readonly props: T) {}

  get id(): string {
    return (this.props as { id: string }).id;
  }

  equals(entity?: Entity<T>): boolean {
    if (entity === null || entity === undefined) {
      return false;
    }
    return this.id === entity.id;
  }
}
