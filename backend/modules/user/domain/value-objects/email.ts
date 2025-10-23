import { ValueObject } from '../../../../shared/domain/value-objects';

export class Email extends ValueObject<string> {
  private constructor(value: string) {
    if (!Email.isValid(value)) {
      throw new Error('Invalid email format');
    }
    super(value);
  }

  static create(value: string): Email {
    return new Email(value);
  }

  private static isValid(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  getValue(): string {
    return this.value;
  }
}
