import { Account } from '../../domain/entities/account';
import { AccountId } from '../../domain/value-objects/account-id';
import { DomainEvent } from '../../domain/events/domain-event';
import { EventType } from '../../domain/events/event-type';
import { Balance } from '../../domain/value-objects/balance';
import { AccountStatus } from '../../domain/value-objects/account-status';
import { ProjectionRegistry } from '../projections/projection-registry';

export interface EventStore {
  appendEvents(streamName: string, events: DomainEvent[]): Promise<void>;
  readEvents(streamName: string): Promise<DomainEvent[]>;
}

export class EventSourcedAccountRepository {
  constructor(
    private readonly eventStore: EventStore,
    private readonly projectionRegistry?: ProjectionRegistry
  ) {}

  async save(account: Account): Promise<void> {
    const streamName = this.getStreamName(account.id);
    const events = account.getUncommittedEvents();

    if (events.length === 0) {
      return;
    }

    await this.eventStore.appendEvents(streamName, events);

    if (this.projectionRegistry) {
      for (const event of events) {
        await this.projectionRegistry.project(event);
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
        case EventType.ACCOUNT_CREATED:
          accountId = eventData.accountId;
          balance = eventData.initialBalance;
          status = eventData.status;
          createdAt = new Date(eventData.createdAt);
          break;

        case EventType.MONEY_DEPOSITED:
          balance = eventData.balanceAfter;
          break;

        case EventType.MONEY_WITHDRAWN:
          balance = eventData.balanceAfter;
          break;

        case EventType.ACCOUNT_SUSPENDED:
          status = 'SUSPENDED';
          break;

        case EventType.ACCOUNT_ACTIVATED:
          status = 'ACTIVE';
          break;

        case EventType.ACCOUNT_CLOSED:
          status = 'CLOSED';
          break;
      }
    }

    if (!accountId) {
      throw new Error('Unable to reconstruct account from events');
    }

    account = Account.reconstruct(
      AccountId.create(accountId),
      Balance.create(balance),
      AccountStatus.create(status),
      createdAt
    );

    return account;
  }
}
