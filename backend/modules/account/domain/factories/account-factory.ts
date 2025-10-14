import { Account } from '../entities/account';
import { AccountId } from '../value-objects/account-id';
import { Balance } from '../value-objects/balance';
import { AccountStatus } from '../value-objects/account-status';
import { AccountCreatedEvent } from '../events/account-events';

export class AccountFactory {
  static createNew(initialBalance: number): Account {
    const accountId = AccountId.generate();
    const balance = Balance.create(initialBalance);
    const status = AccountStatus.active();
    const createdAt = new Date();

    const account = new Account(accountId, balance, status, createdAt);

    account.addEvent(
      new AccountCreatedEvent(accountId.getValue(), {
        accountId: accountId.getValue(),
        initialBalance: balance.getValue(),
        status: status.getValue(),
        createdAt: createdAt.toISOString(),
      })
    );

    return account;
  }
}
