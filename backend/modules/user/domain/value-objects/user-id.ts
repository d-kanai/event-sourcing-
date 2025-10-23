import { randomUUID } from 'crypto';
import { ValueObject } from '../../../../shared/domain/value-objects';

export class UserId extends ValueObject<string> {
  private constructor(value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('UserId cannot be empty');
    }
    super(value);
  }

  static create(value: string): UserId {
    return new UserId(value);
  }

  static generate(): UserId {
    return new UserId(randomUUID());
  }

  getValue(): string {
    return this.value;
  }
}
