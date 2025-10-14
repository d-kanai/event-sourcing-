import { z } from 'zod';

export const AccountIdSchema = z.string().uuid();

export class AccountId {
  private constructor(private readonly value: string) {}

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

  equals(other: AccountId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
