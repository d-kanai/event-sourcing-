export abstract class ValueObject<T> {
  protected constructor(protected readonly value: T) {}

  abstract getValue(): T;

  equals(other: ValueObject<T>): boolean {
    if (!(other instanceof ValueObject)) {
      return false;
    }
    return this.value === other.value;
  }

  toString(): string {
    return String(this.value);
  }
}
