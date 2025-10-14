import { BaseDomainEvent } from './domain-event';
import { EventType } from './event-type';

export interface AccountCreatedData {
  accountId: string;
  initialBalance: number;
  status: string;
  createdAt: string;
}

export class AccountCreatedEvent extends BaseDomainEvent {
  constructor(accountId: string, data: AccountCreatedData) {
    super(EventType.ACCOUNT_CREATED, accountId, data);
  }

  get accountData(): AccountCreatedData {
    return this.data as AccountCreatedData;
  }
}

export interface MoneyDepositedData {
  accountId: string;
  amount: number;
  balanceAfter: number;
  depositedAt: string;
}

export class MoneyDepositedEvent extends BaseDomainEvent {
  constructor(accountId: string, data: MoneyDepositedData) {
    super(EventType.MONEY_DEPOSITED, accountId, data);
  }

  get depositData(): MoneyDepositedData {
    return this.data as MoneyDepositedData;
  }
}

export interface MoneyWithdrawnData {
  accountId: string;
  amount: number;
  balanceAfter: number;
  withdrawnAt: string;
}

export class MoneyWithdrawnEvent extends BaseDomainEvent {
  constructor(accountId: string, data: MoneyWithdrawnData) {
    super(EventType.MONEY_WITHDRAWN, accountId, data);
  }

  get withdrawData(): MoneyWithdrawnData {
    return this.data as MoneyWithdrawnData;
  }
}

export interface AccountSuspendedData {
  accountId: string;
  suspendedAt: string;
}

export class AccountSuspendedEvent extends BaseDomainEvent {
  constructor(accountId: string, data: AccountSuspendedData) {
    super(EventType.ACCOUNT_SUSPENDED, accountId, data);
  }

  get suspensionData(): AccountSuspendedData {
    return this.data as AccountSuspendedData;
  }
}

export interface AccountActivatedData {
  accountId: string;
  activatedAt: string;
}

export class AccountActivatedEvent extends BaseDomainEvent {
  constructor(accountId: string, data: AccountActivatedData) {
    super(EventType.ACCOUNT_ACTIVATED, accountId, data);
  }

  get activationData(): AccountActivatedData {
    return this.data as AccountActivatedData;
  }
}

export interface AccountClosedData {
  accountId: string;
  closedAt: string;
}

export class AccountClosedEvent extends BaseDomainEvent {
  constructor(accountId: string, data: AccountClosedData) {
    super(EventType.ACCOUNT_CLOSED, accountId, data);
  }

  get closureData(): AccountClosedData {
    return this.data as AccountClosedData;
  }
}

export type AccountEvent =
  | AccountCreatedEvent
  | MoneyDepositedEvent
  | MoneyWithdrawnEvent
  | AccountSuspendedEvent
  | AccountActivatedEvent
  | AccountClosedEvent;
