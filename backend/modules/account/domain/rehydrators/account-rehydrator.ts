import { Account } from '../entities/account';
import { AccountId } from '../value-objects/account-id';
import { Balance } from '../value-objects/balance';
import { AccountStatus } from '../value-objects/account-status';
import { DomainEvent } from '../../../shared/domain/events/domain-event';
import { AccountEventType } from '../events/account-event-type';
import { AccountSnapshot } from '../snapshots/account-snapshot';
import { RehydratorStatic } from '../../../shared/infrastructure/event-store/base-event-sourced-repository';

export class AccountRehydrator {
  static rehydrate(events: DomainEvent[]): Account {
    if (events.length === 0) {
      throw new Error('No events to replay');
    }

    const firstEvent = events[0];
    if (firstEvent.eventType !== AccountEventType.ACCOUNT_CREATED) {
      throw new Error('First event must be AccountCreated');
    }

    const eventData = firstEvent.data as any;
    const account = Account.reconstruct(
      AccountId.create(eventData.accountId),
      Balance.create(eventData.initialBalance),
      AccountStatus.create(eventData.status),
      new Date(eventData.createdAt)
    );

    for (let i = 1; i < events.length; i++) {
      this.replayEvent(account, events[i]);
    }

    return account;
  }

  static rehydrateFromSnapshot(
    snapshot: AccountSnapshot,
    eventsAfterSnapshot: DomainEvent[]
  ): Account {
    const account = Account.reconstruct(
      AccountId.create(snapshot.accountId),
      Balance.create(snapshot.balance),
      AccountStatus.create(snapshot.status),
      new Date(snapshot.createdAt)
    );

    for (const event of eventsAfterSnapshot) {
      this.replayEvent(account, event);
    }

    return account;
  }

  static createSnapshot(account: Account, version: number): AccountSnapshot {
    return AccountSnapshot.create(
      account.id.getValue(),
      account.balance.getValue(),
      account.status.getValue(),
      account.createdAt.toISOString(),
      version
    );
  }

  private static replayEvent(account: Account, event: DomainEvent): void {
    const eventData = event.data as any;

    switch (event.eventType) {
      case AccountEventType.MONEY_DEPOSITED:
        const newBalanceAfterDeposit = account.balance.add(eventData.amount);
        account.applyBalanceChange(newBalanceAfterDeposit);
        break;

      case AccountEventType.MONEY_WITHDRAWN:
        const newBalanceAfterWithdraw = account.balance.subtract(eventData.amount);
        account.applyBalanceChange(newBalanceAfterWithdraw);
        break;

      default:
        throw new Error(`Unknown event type: ${event.eventType}`);
    }
  }
}

const _typeCheck: RehydratorStatic<Account, AccountSnapshot> = AccountRehydrator;
