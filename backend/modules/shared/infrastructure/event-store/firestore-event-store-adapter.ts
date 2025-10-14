import { DomainEvent } from '../../domain/events/domain-event';
import { EventStore } from './base-event-sourced-repository';
import { FirestoreEventStore } from './firestore-event-store';

export class FirestoreEventStoreAdapter implements EventStore {
  constructor(
    private readonly firestoreEventStore: FirestoreEventStore,
    private readonly aggregateType: string
  ) {}

  async appendEvents(streamName: string, events: DomainEvent[]): Promise<void> {
    if (events.length === 0) return;

    const aggregateId = this.extractAggregateId(streamName);
    const currentVersion = await this.firestoreEventStore.getCurrentVersion(
      aggregateId,
      this.aggregateType
    );

    await this.firestoreEventStore.save(
      aggregateId,
      this.aggregateType,
      events,
      currentVersion
    );
  }

  async readEvents(streamName: string): Promise<DomainEvent[]> {
    const aggregateId = this.extractAggregateId(streamName);
    return this.firestoreEventStore.getEvents(aggregateId, this.aggregateType);
  }

  async readEventsAfterVersion(
    streamName: string,
    afterVersion: number
  ): Promise<DomainEvent[]> {
    const aggregateId = this.extractAggregateId(streamName);
    return this.firestoreEventStore.getEventsFromVersion(
      aggregateId,
      this.aggregateType,
      afterVersion + 1
    );
  }

  private extractAggregateId(streamName: string): string {
    const prefix = `${this.aggregateType.toLowerCase()}-`;
    if (streamName.startsWith(prefix)) {
      return streamName.substring(prefix.length);
    }
    return streamName;
  }
}
