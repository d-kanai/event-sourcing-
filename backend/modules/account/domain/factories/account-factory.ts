import { Account } from '../entities/account';
import { Balance } from '../value-objects/balance';

/**
 * Factory for creating Account aggregates
 * Encapsulates the complex assembly logic of creating accounts
 */
export class AccountFactory {
  /**
   * Create a new account with specified initial balance
   *
   * @param initialBalance - Initial balance amount (must be non-negative)
   * @returns New account instance
   */
  static createNew(initialBalance: number): Account {
    const balance = Balance.create(initialBalance);
    return Account.create(balance);
  }
}
