import { Account } from '../../domain/entities/account';
import { AccountId } from '../../domain/value-objects/account-id';
import { DomainEvent } from '../../../shared/domain/events/domain-event';
import { AccountRehydrator } from '../../domain/rehydrators/account-rehydrator';
import { ProjectionRegistry } from '../projections/projection-registry';
import { SnapshotRepository } from '../../domain/repositories/snapshot-repository';

export interface EventStore {
  appendEvents(streamName: string, events: DomainEvent[]): Promise<void>;
  readEvents(streamName: string): Promise<DomainEvent[]>;
  readEventsAfterVersion(streamName: string, afterVersion: number): Promise<DomainEvent[]>;
}

/**
 * Event Sourced Account Repository with Snapshot Support
 *
 * Snapshot Strategy (Industry standard: every 100 events)
 * - On save: If event count is multiple of SNAPSHOT_INTERVAL, create snapshot
 * - On load: Try to load snapshot first, then replay events after snapshot
 *
 * Performance comparison for 10,000 events:
 * - Without snapshot: Replay 10,000 events
 * - With snapshot at 9,900: Load snapshot + replay 100 events
 */
export class EventSourcedAccountRepository {
  private static readonly SNAPSHOT_INTERVAL = 100; // Create snapshot every 100 events

  constructor(
    private readonly eventStore: EventStore,
    private readonly projectionRegistry?: ProjectionRegistry,
    private readonly snapshotRepository?: SnapshotRepository
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

    // Create snapshot periodically
    if (this.snapshotRepository) {
      const allEvents = await this.eventStore.readEvents(streamName);
      const eventCount = allEvents.length;

      // Create snapshot every SNAPSHOT_INTERVAL events
      if (eventCount % EventSourcedAccountRepository.SNAPSHOT_INTERVAL === 0) {
        const snapshot = AccountRehydrator.createSnapshot(account, eventCount);
        await this.snapshotRepository.save(snapshot);
      }
    }

    account.clearUncommittedEvents();
  }

  async findById(id: AccountId): Promise<Account | null> {
    const streamName = this.getStreamName(id);

    // Try to load from snapshot first (performance optimization)
    if (this.snapshotRepository) {
      const snapshot = await this.snapshotRepository.getLatest(id.getValue());

      if (snapshot) {
        // Load events after snapshot
        const eventsAfterSnapshot = await this.eventStore.readEventsAfterVersion(
          streamName,
          snapshot.version
        );

        // Rehydrate from snapshot + remaining events
        return AccountRehydrator.rehydrateFromSnapshot(snapshot, eventsAfterSnapshot);
      }
    }

    // Fallback: Load all events (no snapshot available)
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
