export abstract class BaseFactory<T> {
  abstract build(overrides?: Partial<T>): T;

  buildMany(count: number, overrides?: Partial<T>): T[] {
    return Array.from({ length: count }, () => this.build(overrides));
  }
}
