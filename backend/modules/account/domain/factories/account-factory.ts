import { Account } from '../entities/account';
import { AccountId } from '../value-objects/account-id';
import { Balance } from '../value-objects/balance';
import { AccountStatus } from '../value-objects/account-status';

/**
 * Factory for creating Account aggregates
 * Encapsulates the assembly logic and business rules for account creation
 *
 * Creation rules:
 * - ID is auto-generated
 * - Status is always ACTIVE
 * - CreatedAt is current time
 * - InitialBalance is specified by caller
 */
export class AccountFactory {
  /**
   * Create a new account with specified initial balance
   *
   * @param initialBalance - Initial balance amount (must be non-negative)
   * @returns New account instance with AccountCreated event
   */
  static createNew(initialBalance: number): Account {
    const accountId = AccountId.generate();
    const balance = Balance.create(initialBalance);
    const status = AccountStatus.active();
    const createdAt = new Date();

    const account = new Account(accountId, balance, status, createdAt);
    account.emitCreatedEvent();

    return account;
  }
}
