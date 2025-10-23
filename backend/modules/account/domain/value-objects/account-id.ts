import { z } from 'zod';
import { ValueObject } from '../../../../shared/domain/value-objects';

export const AccountIdSchema = z.string().uuid();

export class AccountId extends ValueObject<string> {
  private constructor(value: string) {
    super(value);
  }

  static create(value: string): AccountId {
    const result = AccountIdSchema.safeParse(value);
    if (!result.success) {
      throw new Error(`Invalid account ID: ${value}`);
    }
    return new AccountId(result.data);
  }

  static generate(): AccountId {
    return new AccountId(crypto.randomUUID());
  }

  getValue(): string {
    return this.value;
  }
}
