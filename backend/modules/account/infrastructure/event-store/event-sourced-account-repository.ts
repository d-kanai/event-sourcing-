import { Account } from '../../domain/entities/account';
import { AccountId } from '../../domain/value-objects/account-id';
import { DomainEvent } from '../../domain/events/domain-event';
import { Balance } from '../../domain/value-objects/balance';
import { AccountStatus } from '../../domain/value-objects/account-status';
import { AccountProjection } from '../projections/account-projection';

export interface EventStore {
  appendEvents(streamName: string, events: DomainEvent[]): Promise<void>;
  readEvents(streamName: string): Promise<DomainEvent[]>;
}

export class EventSourcedAccountRepository {
  constructor(
    private readonly eventStore: EventStore,
    private readonly projection?: AccountProjection
  ) {}

  async save(account: Account): Promise<void> {
    const streamName = this.getStreamName(account.id);
    const events = account.getUncommittedEvents();

    if (events.length === 0) {
      return;
    }

    await this.eventStore.appendEvents(streamName, events);

    if (this.projection) {
      for (const event of events) {
        await this.projection.project(event);
      }
    }

    account.clearUncommittedEvents();
  }

  async findById(id: AccountId): Promise<Account | null> {
    const streamName = this.getStreamName(id);
    const events = await this.eventStore.readEvents(streamName);

    if (events.length === 0) {
      return null;
    }

    return this.replayEvents(events);
  }

  private getStreamName(accountId: AccountId): string {
    return `account-${accountId.getValue()}`;
  }

  private replayEvents(events: DomainEvent[]): Account {
    let account: Account | null = null;
    let balance = 0;
    let status = 'ACTIVE';
    let createdAt = new Date();
    let accountId = '';

    for (const event of events) {
      const eventData = event.data as any;

      switch (event.eventType) {
        case 'AccountCreated':
          accountId = eventData.accountId;
          balance = eventData.initialBalance;
          status = eventData.status;
          createdAt = new Date(eventData.createdAt);
          break;

        case 'MoneyDeposited':
          balance = eventData.balanceAfter;
          break;

        case 'MoneyWithdrawn':
          balance = eventData.balanceAfter;
          break;

        case 'AccountSuspended':
          status = 'SUSPENDED';
          break;

        case 'AccountActivated':
          status = 'ACTIVE';
          break;

        case 'AccountClosed':
          status = 'CLOSED';
          break;
      }
    }

    if (!accountId) {
      throw new Error('Unable to reconstruct account from events');
    }

    account = Account.reconstruct({
      id: AccountId.create(accountId),
      balance: Balance.create(balance),
      status: AccountStatus.create(status),
      createdAt: createdAt,
    });

    return account;
  }
}
