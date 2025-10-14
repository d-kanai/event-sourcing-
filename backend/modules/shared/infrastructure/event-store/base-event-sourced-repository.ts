import { AggregateRoot } from '../../domain/entities/aggregate-root';
import { DomainEvent } from '../../domain/events/domain-event';

/**
 * Event Store interface
 * Implementations: InMemoryEventStore (testing), EventStoreDBAdapter (production)
 */
export interface EventStore {
  appendEvents(streamName: string, events: DomainEvent[]): Promise<void>;
  readEvents(streamName: string): Promise<DomainEvent[]>;
  readEventsAfterVersion(streamName: string, afterVersion: number): Promise<DomainEvent[]>;
}

/**
 * Generic Snapshot interface
 * Each aggregate defines its own snapshot structure
 */
export interface Snapshot {
  version: number; // Event count at snapshot time
}

/**
 * Generic Snapshot Repository interface
 */
export interface SnapshotRepository<T extends Snapshot> {
  save(snapshot: T): Promise<void>;
  getLatest(aggregateId: string): Promise<T | null>;
  delete(aggregateId: string): Promise<void>;
}

/**
 * Projection Registry interface
 * Projects events to read models
 * Implementation: ProjectionRegistry in shared/infrastructure/projections
 */
export interface ProjectionRegistry {
  project(event: DomainEvent): Promise<void>;
}

/**
 * Rehydrator interface (using static methods pattern)
 * Each aggregate implements its own rehydration logic as static methods
 * Static methods are preferred for stateless rehydration logic
 */
export interface RehydratorStatic<TAggregate extends AggregateRoot, TSnapshot extends Snapshot> {
  /**
   * Rehydrate aggregate from all events (no snapshot)
   */
  rehydrate(events: DomainEvent[]): TAggregate;

  /**
   * Rehydrate aggregate from snapshot + events after snapshot
   */
  rehydrateFromSnapshot(snapshot: TSnapshot, eventsAfterSnapshot: DomainEvent[]): TAggregate;

  /**
   * Create snapshot from current aggregate state
   */
  createSnapshot(aggregate: TAggregate, version: number): TSnapshot;
}

/**
 * Base Event Sourced Repository with Snapshot Support
 *
 * This abstract class provides common functionality for event-sourced aggregates:
 * - Event storage and retrieval
 * - Snapshot creation and loading (performance optimization)
 * - Projection to read models (optional)
 *
 * Industry standard: Snapshot every 100 events (Axon Framework)
 *
 * Type Parameters:
 * - TAggregate: Aggregate root type (e.g., Account)
 * - TId: ID value object type (e.g., AccountId)
 * - TSnapshot: Snapshot type (e.g., AccountSnapshot)
 *
 * Usage:
 * class AccountRepository extends BaseEventSourcedRepository<Account, AccountId, AccountSnapshot> {
 *   protected getStreamName(id: AccountId): string {
 *     return `account-${id.getValue()}`;
 *   }
 * }
 */
export abstract class BaseEventSourcedRepository<
  TAggregate extends AggregateRoot,
  TId,
  TSnapshot extends Snapshot
> {
  protected static readonly SNAPSHOT_INTERVAL = 100; // Create snapshot every 100 events

  constructor(
    protected readonly eventStore: EventStore,
    protected readonly rehydrator: RehydratorStatic<TAggregate, TSnapshot>,
    protected readonly projectionRegistry?: ProjectionRegistry,
    protected readonly snapshotRepository?: SnapshotRepository<TSnapshot>
  ) {}

  /**
   * Save aggregate changes to event store
   * - Append uncommitted events to event store
   * - Project events to read models (optional)
   * - Create snapshot periodically (optional)
   */
  async save(aggregate: TAggregate): Promise<void> {
    const streamName = this.getStreamName(this.extractId(aggregate));
    const events = aggregate.getUncommittedEvents();

    if (events.length === 0) {
      return;
    }

    // Append events to event store
    await this.eventStore.appendEvents(streamName, events);

    // Project events to read models (eventual consistency)
    if (this.projectionRegistry) {
      for (const event of events) {
        await this.projectionRegistry.project(event);
      }
    }

    // Create snapshot periodically (performance optimization)
    if (this.snapshotRepository) {
      const allEvents = await this.eventStore.readEvents(streamName);
      const eventCount = allEvents.length;

      // Snapshot every SNAPSHOT_INTERVAL events
      if (eventCount % BaseEventSourcedRepository.SNAPSHOT_INTERVAL === 0) {
        const snapshot = this.rehydrator.createSnapshot(aggregate, eventCount);
        await this.snapshotRepository.save(snapshot);
      }
    }

    aggregate.clearUncommittedEvents();
  }

  /**
   * Replay aggregate by ID from event store
   * - Try to load from snapshot first (performance optimization)
   * - Fallback to full event replay if no snapshot exists
   * - Return null if aggregate doesn't exist
   *
   * This method replays events to reconstruct the aggregate's current state.
   * Use this in Commands to get the latest aggregate state before executing domain logic.
   */
  async replayById(id: TId): Promise<TAggregate | null> {
    const streamName = this.getStreamName(id);
    const aggregateId = this.extractIdValue(id);

    // Try to load from snapshot first (performance optimization)
    if (this.snapshotRepository) {
      const snapshot = await this.snapshotRepository.getLatest(aggregateId);

      if (snapshot) {
        // Load events after snapshot
        const eventsAfterSnapshot = await this.eventStore.readEventsAfterVersion(
          streamName,
          snapshot.version
        );

        // Rehydrate from snapshot + remaining events
        return this.rehydrator.rehydrateFromSnapshot(snapshot, eventsAfterSnapshot);
      }
    }

    // Fallback: Load all events (no snapshot available)
    const events = await this.eventStore.readEvents(streamName);

    if (events.length === 0) {
      return null;
    }

    return this.rehydrator.rehydrate(events);
  }

  /**
   * Get stream name for aggregate
   * Each aggregate type has its own naming convention (e.g., "account-{id}", "order-{id}")
   */
  protected abstract getStreamName(id: TId): string;

  /**
   * Extract aggregate ID for snapshot lookup
   * Converts ID value object to string (e.g., AccountId -> string)
   */
  protected abstract extractIdValue(id: TId): string;

  /**
   * Extract ID from aggregate
   * Each aggregate provides access to its ID differently
   */
  protected abstract extractId(aggregate: TAggregate): TId;
}
