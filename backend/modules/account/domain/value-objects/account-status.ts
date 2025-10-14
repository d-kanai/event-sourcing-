import { z } from 'zod';

export const AccountStatusEnum = {
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  CLOSED: 'CLOSED',
} as const;

export type AccountStatusType = typeof AccountStatusEnum[keyof typeof AccountStatusEnum];

export const AccountStatusSchema = z.enum([
  AccountStatusEnum.ACTIVE,
  AccountStatusEnum.SUSPENDED,
  AccountStatusEnum.CLOSED,
]);

export class AccountStatus {
  private constructor(private readonly value: AccountStatusType) {}

  static create(value: string): AccountStatus {
    const result = AccountStatusSchema.safeParse(value);
    if (!result.success) {
      throw new Error(`Invalid account status: ${value}`);
    }
    return new AccountStatus(result.data);
  }

  static active(): AccountStatus {
    return new AccountStatus(AccountStatusEnum.ACTIVE);
  }

  static suspended(): AccountStatus {
    return new AccountStatus(AccountStatusEnum.SUSPENDED);
  }

  static closed(): AccountStatus {
    return new AccountStatus(AccountStatusEnum.CLOSED);
  }

  getValue(): AccountStatusType {
    return this.value;
  }

  isActive(): boolean {
    return this.value === AccountStatusEnum.ACTIVE;
  }

  isSuspended(): boolean {
    return this.value === AccountStatusEnum.SUSPENDED;
  }

  isClosed(): boolean {
    return this.value === AccountStatusEnum.CLOSED;
  }

  equals(other: AccountStatus): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
