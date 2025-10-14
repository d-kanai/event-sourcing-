import { AccountId } from '../value-objects/account-id';
import { Balance } from '../value-objects/balance';
import { AccountStatus } from '../value-objects/account-status';
import {
  MoneyDepositedEvent,
  MoneyWithdrawnEvent,
  AccountSuspendedEvent,
  AccountActivatedEvent,
  AccountClosedEvent,
} from '../events/account-events';
import { AggregateRoot } from '../../../shared/domain/entities/aggregate-root';

export class Account extends AggregateRoot {
  private readonly _id: AccountId;
  private _balance: Balance;
  private _status: AccountStatus;
  private readonly _createdAt: Date;

  /**
   * Constructor is public for Factory use
   * Use AccountFactory.createNew() for creating new accounts
   * Use Account.reconstruct() for rebuilding from events
   */
  constructor(
    id: AccountId,
    balance: Balance,
    status: AccountStatus,
    createdAt: Date
  ) {
    super();
    this._id = id;
    this._balance = balance;
    this._status = status;
    this._createdAt = createdAt;
  }

  /**
   * Reconstruct account from event store
   * Does not emit events (used for event replay)
   */
  static reconstruct(
    id: AccountId,
    balance: Balance,
    status: AccountStatus,
    createdAt: Date
  ): Account {
    return new Account(id, balance, status, createdAt);
  }


  get id(): AccountId {
    return this._id;
  }

  get balance(): Balance {
    return this._balance;
  }

  get status(): AccountStatus {
    return this._status;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  deposit(amount: number): void {
    if (!this._status.isActive()) {
      throw new Error('Cannot deposit to non-active account');
    }
    this._balance = this._balance.add(amount);

    this.addEvent(
      new MoneyDepositedEvent(this._id.getValue(), {
        accountId: this._id.getValue(),
        amount: amount,
        depositedAt: new Date().toISOString(),
      })
    );
  }

  withdraw(amount: number): void {
    if (!this._status.isActive()) {
      throw new Error('Cannot withdraw from non-active account');
    }
    this._balance = this._balance.subtract(amount);

    this.addEvent(
      new MoneyWithdrawnEvent(this._id.getValue(), {
        accountId: this._id.getValue(),
        amount: amount,
        withdrawnAt: new Date().toISOString(),
      })
    );
  }

  suspend(): void {
    if (this._status.isClosed()) {
      throw new Error('Cannot suspend a closed account');
    }
    this._status = AccountStatus.suspended();

    this.addEvent(
      new AccountSuspendedEvent(this._id.getValue(), {
        accountId: this._id.getValue(),
        suspendedAt: new Date().toISOString(),
      })
    );
  }

  activate(): void {
    if (this._status.isClosed()) {
      throw new Error('Cannot activate a closed account');
    }
    this._status = AccountStatus.active();

    this.addEvent(
      new AccountActivatedEvent(this._id.getValue(), {
        accountId: this._id.getValue(),
        activatedAt: new Date().toISOString(),
      })
    );
  }

  close(): void {
    if (!this._balance.equals(Balance.zero())) {
      throw new Error('Cannot close account with non-zero balance');
    }
    this._status = AccountStatus.closed();

    this.addEvent(
      new AccountClosedEvent(this._id.getValue(), {
        accountId: this._id.getValue(),
        closedAt: new Date().toISOString(),
      })
    );
  }

  /**
   * Apply balance change (for event replay only, called by AccountRehydrator)
   * Does not validate business rules or emit events
   */
  applyBalanceChange(balance: Balance): void {
    this._balance = balance;
  }

  /**
   * Apply status change (for event replay only, called by AccountRehydrator)
   * Does not validate business rules or emit events
   */
  applyStatusChange(status: AccountStatus): void {
    this._status = status;
  }

  toJSON() {
    return {
      id: this.id.getValue(),
      balance: this.balance.getValue(),
      status: this.status.getValue(),
      createdAt: this.createdAt.toISOString(),
    };
  }
}
