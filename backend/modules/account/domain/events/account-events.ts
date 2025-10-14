import { BaseDomainEvent } from '../../../shared/domain/events/domain-event';
import { AccountEventType } from './account-event-type';

export interface AccountCreatedData {
  accountId: string;
  initialBalance: number;
  status: string;
  createdAt: string;
}

export class AccountCreatedEvent extends BaseDomainEvent {
  constructor(accountId: string, data: AccountCreatedData) {
    super(AccountEventType.ACCOUNT_CREATED, accountId, data);
  }

  get accountData(): AccountCreatedData {
    return this.data as AccountCreatedData;
  }
}

export interface MoneyDepositedData {
  accountId: string;
  amount: number;
  depositedAt: string;
}

export class MoneyDepositedEvent extends BaseDomainEvent {
  constructor(accountId: string, data: MoneyDepositedData) {
    super(AccountEventType.MONEY_DEPOSITED, accountId, data);
  }

  get depositData(): MoneyDepositedData {
    return this.data as MoneyDepositedData;
  }
}

export interface MoneyWithdrawnData {
  accountId: string;
  amount: number;
  withdrawnAt: string;
}

export class MoneyWithdrawnEvent extends BaseDomainEvent {
  constructor(accountId: string, data: MoneyWithdrawnData) {
    super(AccountEventType.MONEY_WITHDRAWN, accountId, data);
  }

  get withdrawData(): MoneyWithdrawnData {
    return this.data as MoneyWithdrawnData;
  }
}

export type AccountEvent =
  | AccountCreatedEvent
  | MoneyDepositedEvent
  | MoneyWithdrawnEvent;
