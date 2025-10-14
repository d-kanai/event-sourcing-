import { Account } from '../../domain/entities/account';
import { AccountId } from '../../domain/value-objects/account-id';
import { DomainEvent } from '../../../shared/domain/events/domain-event';
import { AccountRehydrator } from '../../domain/rehydrators/account-rehydrator';
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

    return AccountRehydrator.rehydrate(events);
  }

  private getStreamName(accountId: AccountId): string {
    return `account-${accountId.getValue()}`;
  }
}
