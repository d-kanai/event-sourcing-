import { AggregateRoot } from '../../domain/entities/aggregate-root';
import { DomainEvent } from '../../domain/events/domain-event';

export interface EventStore {
  appendEvents(streamName: string, events: DomainEvent[]): Promise<void>;
  readEvents(streamName: string): Promise<DomainEvent[]>;
  readEventsAfterVersion(streamName: string, afterVersion: number): Promise<DomainEvent[]>;
}

export interface Snapshot {
  version: number;
}

export interface SnapshotRepository<T extends Snapshot> {
  save(snapshot: T): Promise<void>;
  getLatest(aggregateId: string): Promise<T | null>;
  delete(aggregateId: string): Promise<void>;
}

export interface ProjectionRegistry {
  project(event: DomainEvent): Promise<void>;
}

export interface RehydratorStatic<TAggregate extends AggregateRoot, TSnapshot extends Snapshot> {
  rehydrate(events: DomainEvent[]): TAggregate;

  rehydrateFromSnapshot(snapshot: TSnapshot, eventsAfterSnapshot: DomainEvent[]): TAggregate;

  createSnapshot(aggregate: TAggregate, version: number): TSnapshot;
}

export abstract class BaseEventSourcedRepository<
  TAggregate extends AggregateRoot,
  TId,
  TSnapshot extends Snapshot
> {
  protected static readonly SNAPSHOT_INTERVAL = 100;

  constructor(
    protected readonly eventStore: EventStore,
    protected readonly rehydrator: RehydratorStatic<TAggregate, TSnapshot>,
    protected readonly projectionRegistry?: ProjectionRegistry,
    protected readonly snapshotRepository?: SnapshotRepository<TSnapshot>
  ) {}

  async save(aggregate: TAggregate): Promise<void> {
    const streamName = this.getStreamName(this.extractId(aggregate));
    const events = aggregate.getUncommittedEvents();

    if (events.length === 0) {
      return;
    }

    await this.eventStore.appendEvents(streamName, events);

    if (this.projectionRegistry) {
      for (const event of events) {
        await this.projectionRegistry.project(event);
      }
    }

    if (this.snapshotRepository) {
      const allEvents = await this.eventStore.readEvents(streamName);
      const eventCount = allEvents.length;

      if (eventCount % BaseEventSourcedRepository.SNAPSHOT_INTERVAL === 0) {
        const snapshot = this.rehydrator.createSnapshot(aggregate, eventCount);
        await this.snapshotRepository.save(snapshot);
      }
    }

    aggregate.clearUncommittedEvents();
  }

  async replayById(id: TId): Promise<TAggregate | null> {
    const streamName = this.getStreamName(id);
    const aggregateId = this.extractIdValue(id);

    if (this.snapshotRepository) {
      const snapshot = await this.snapshotRepository.getLatest(aggregateId);

      if (snapshot) {
        const eventsAfterSnapshot = await this.eventStore.readEventsAfterVersion(
          streamName,
          snapshot.version
        );

        return this.rehydrator.rehydrateFromSnapshot(snapshot, eventsAfterSnapshot);
      }
    }

    const events = await this.eventStore.readEvents(streamName);

    if (events.length === 0) {
      return null;
    }

    return this.rehydrator.rehydrate(events);
  }

  protected abstract getStreamName(id: TId): string;

  protected abstract extractIdValue(id: TId): string;

  protected abstract extractId(aggregate: TAggregate): TId;
}
