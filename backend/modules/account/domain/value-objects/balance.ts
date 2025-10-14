import { z } from 'zod';

export const BalanceSchema = z.number().nonnegative();

export class Balance {
  private constructor(private readonly value: number) {}

  static create(value: number): Balance {
    const result = BalanceSchema.safeParse(value);
    if (!result.success) {
      throw new Error(`Invalid balance: ${value}. Balance must be non-negative.`);
    }
    return new Balance(result.data);
  }

  static zero(): Balance {
    return new Balance(0);
  }

  getValue(): number {
    return this.value;
  }

  add(amount: number): Balance {
    if (amount < 0) {
      throw new Error('Amount to add must be non-negative');
    }
    return new Balance(this.value + amount);
  }

  subtract(amount: number): Balance {
    if (amount < 0) {
      throw new Error('Amount to subtract must be non-negative');
    }
    const newBalance = this.value - amount;
    if (newBalance < 0) {
      throw new Error('Insufficient balance');
    }
    return new Balance(newBalance);
  }

  equals(other: Balance): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value.toFixed(4);
  }
}
