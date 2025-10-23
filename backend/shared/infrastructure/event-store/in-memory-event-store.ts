import { DomainEvent } from '../../domain/events/domain-event';
import { EventStore } from './base-event-sourced-repository';

export class InMemoryEventStore implements EventStore {
  private streams: Map<string, DomainEvent[]> = new Map();

  async appendEvents(streamName: string, events: DomainEvent[]): Promise<void> {
    const existingEvents = this.streams.get(streamName) || [];
    this.streams.set(streamName, [...existingEvents, ...events]);
  }

  async readEvents(streamName: string): Promise<DomainEvent[]> {
    return this.streams.get(streamName) || [];
  }

  async readEventsAfterVersion(streamName: string, afterVersion: number): Promise<DomainEvent[]> {
    const allEvents = this.streams.get(streamName) || [];
    return allEvents.slice(afterVersion);
  }

  clear(): void {
    this.streams.clear();
  }

  getStreamNames(): string[] {
    return Array.from(this.streams.keys());
  }

  getEventCount(streamName: string): number {
    return this.streams.get(streamName)?.length || 0;
  }
}
