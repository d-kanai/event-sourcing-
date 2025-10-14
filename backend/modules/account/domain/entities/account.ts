import { AccountId } from '../value-objects/account-id';
import { Balance } from '../value-objects/balance';
import { AccountStatus } from '../value-objects/account-status';
import { DomainEvent } from '../events/domain-event';
import {
  AccountCreatedEvent,
  MoneyDepositedEvent,
  MoneyWithdrawnEvent,
  AccountSuspendedEvent,
  AccountActivatedEvent,
  AccountClosedEvent,
} from '../events/account-events';

export interface AccountProps {
  id: AccountId;
  balance: Balance;
  status: AccountStatus;
  createdAt: Date;
}

export class Account {
  private uncommittedEvents: DomainEvent[] = [];

  private constructor(private props: AccountProps) {}

  static create(props: {
    id?: AccountId;
    balance?: Balance;
    status?: AccountStatus;
    createdAt?: Date;
  }): Account {
    const accountId = props.id ?? AccountId.generate();
    const initialBalance = props.balance ?? Balance.zero();
    const status = props.status ?? AccountStatus.active();
    const createdAt = props.createdAt ?? new Date();

    const account = new Account({
      id: accountId,
      balance: initialBalance,
      status: status,
      createdAt: createdAt,
    });

    account.addEvent(
      new AccountCreatedEvent(accountId.getValue(), {
        accountId: accountId.getValue(),
        initialBalance: initialBalance.getValue(),
        status: status.getValue(),
        createdAt: createdAt.toISOString(),
      })
    );

    return account;
  }

  static reconstruct(props: AccountProps): Account {
    return new Account(props);
  }

  get id(): AccountId {
    return this.props.id;
  }

  get balance(): Balance {
    return this.props.balance;
  }

  get status(): AccountStatus {
    return this.props.status;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  deposit(amount: number): void {
    if (!this.status.isActive()) {
      throw new Error('Cannot deposit to non-active account');
    }
    this.props.balance = this.props.balance.add(amount);

    this.addEvent(
      new MoneyDepositedEvent(this.id.getValue(), {
        accountId: this.id.getValue(),
        amount: amount,
        balanceAfter: this.props.balance.getValue(),
        depositedAt: new Date().toISOString(),
      })
    );
  }

  withdraw(amount: number): void {
    if (!this.status.isActive()) {
      throw new Error('Cannot withdraw from non-active account');
    }
    this.props.balance = this.props.balance.subtract(amount);

    this.addEvent(
      new MoneyWithdrawnEvent(this.id.getValue(), {
        accountId: this.id.getValue(),
        amount: amount,
        balanceAfter: this.props.balance.getValue(),
        withdrawnAt: new Date().toISOString(),
      })
    );
  }

  suspend(): void {
    if (this.status.isClosed()) {
      throw new Error('Cannot suspend a closed account');
    }
    this.props.status = AccountStatus.suspended();

    this.addEvent(
      new AccountSuspendedEvent(this.id.getValue(), {
        accountId: this.id.getValue(),
        suspendedAt: new Date().toISOString(),
      })
    );
  }

  activate(): void {
    if (this.status.isClosed()) {
      throw new Error('Cannot activate a closed account');
    }
    this.props.status = AccountStatus.active();

    this.addEvent(
      new AccountActivatedEvent(this.id.getValue(), {
        accountId: this.id.getValue(),
        activatedAt: new Date().toISOString(),
      })
    );
  }

  close(): void {
    if (!this.balance.equals(Balance.zero())) {
      throw new Error('Cannot close account with non-zero balance');
    }
    this.props.status = AccountStatus.closed();

    this.addEvent(
      new AccountClosedEvent(this.id.getValue(), {
        accountId: this.id.getValue(),
        closedAt: new Date().toISOString(),
      })
    );
  }

  private addEvent(event: DomainEvent): void {
    this.uncommittedEvents.push(event);
  }

  getUncommittedEvents(): DomainEvent[] {
    return [...this.uncommittedEvents];
  }

  clearUncommittedEvents(): void {
    this.uncommittedEvents = [];
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
