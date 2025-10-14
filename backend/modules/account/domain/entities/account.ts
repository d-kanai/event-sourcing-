import { AccountId } from '../value-objects/account-id';
import { Balance } from '../value-objects/balance';
import { AccountStatus } from '../value-objects/account-status';
import {
  MoneyDepositedEvent,
  MoneyWithdrawnEvent,
} from '../events/account-events';
import { AggregateRoot } from '../../../shared/domain/entities/aggregate-root';

export class Account extends AggregateRoot {
  private readonly _id: AccountId;
  private _balance: Balance;
  private _status: AccountStatus;
  private readonly _createdAt: Date;

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

  applyBalanceChange(balance: Balance): void {
    this._balance = balance;
  }

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
