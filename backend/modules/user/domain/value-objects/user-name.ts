import { ValueObject } from '../../../../shared/domain/value-objects';

export class UserName extends ValueObject<string> {
  private constructor(value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('UserName cannot be empty');
    }
    if (value.length > 100) {
      throw new Error('UserName is too long (max 100 characters)');
    }
    super(value);
  }

  static create(value: string): UserName {
    return new UserName(value.trim());
  }

  getValue(): string {
    return this.value;
  }
}
