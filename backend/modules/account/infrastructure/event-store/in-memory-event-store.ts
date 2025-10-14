import { DomainEvent } from '../../../shared/domain/events/domain-event';
import { EventStore } from './event-sourced-account-repository';

/**
 * In-memory event store for testing
 */
export class InMemoryEventStore implements EventStore {
  private streams: Map<string, DomainEvent[]> = new Map();

  async appendEvents(streamName: string, events: DomainEvent[]): Promise<void> {
    const existingEvents = this.streams.get(streamName) || [];
    this.streams.set(streamName, [...existingEvents, ...events]);
  }

  async readEvents(streamName: string): Promise<DomainEvent[]> {
    return this.streams.get(streamName) || [];
  }

  clear(): void {
    this.streams.clear();
  }
}
