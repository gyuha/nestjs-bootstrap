export abstract class ValueObject<T> {
  constructor(protected readonly props: T) {}

  equals(valueObject?: ValueObject<T>): boolean {
    if (valueObject === null || valueObject === undefined) {
      return false;
    }
    return JSON.stringify(this.props) === JSON.stringify(valueObject.props);
  }
}
