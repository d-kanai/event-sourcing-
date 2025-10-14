import { AccountId } from '../value-objects/account-id';
import { Balance } from '../value-objects/balance';
import { AccountStatus } from '../value-objects/account-status';

export interface AccountProps {
  id: AccountId;
  balance: Balance;
  status: AccountStatus;
  createdAt: Date;
}

export class Account {
  private constructor(private props: AccountProps) {}

  static create(props: {
    id?: AccountId;
    balance?: Balance;
    status?: AccountStatus;
    createdAt?: Date;
  }): Account {
    return new Account({
      id: props.id ?? AccountId.generate(),
      balance: props.balance ?? Balance.zero(),
      status: props.status ?? AccountStatus.active(),
      createdAt: props.createdAt ?? new Date(),
    });
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
  }

  withdraw(amount: number): void {
    if (!this.status.isActive()) {
      throw new Error('Cannot withdraw from non-active account');
    }
    this.props.balance = this.props.balance.subtract(amount);
  }

  suspend(): void {
    if (this.status.isClosed()) {
      throw new Error('Cannot suspend a closed account');
    }
    this.props.status = AccountStatus.suspended();
  }

  activate(): void {
    if (this.status.isClosed()) {
      throw new Error('Cannot activate a closed account');
    }
    this.props.status = AccountStatus.active();
  }

  close(): void {
    if (!this.balance.equals(Balance.zero())) {
      throw new Error('Cannot close account with non-zero balance');
    }
    this.props.status = AccountStatus.closed();
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
