import { DomainEvent } from '../../domain/events/domain-event';
import { EventStore } from './base-event-sourced-repository';

/**
 * In-Memory Event Store for Testing
 *
 * Simple in-memory implementation of EventStore interface
 * Used for unit and integration tests
 *
 * Features:
 * - Events stored in Map<streamName, DomainEvent[]>
 * - Supports snapshot optimization via readEventsAfterVersion
 * - clear() method for test cleanup
 *
 * Do NOT use in production - data is lost on restart
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

  async readEventsAfterVersion(streamName: string, afterVersion: number): Promise<DomainEvent[]> {
    const allEvents = this.streams.get(streamName) || [];
    // Version is 1-indexed (event count), so skip first afterVersion events
    return allEvents.slice(afterVersion);
  }

  /**
   * Clear all streams (for test cleanup)
   */
  clear(): void {
    this.streams.clear();
  }

  /**
   * Get all stream names (for debugging)
   */
  getStreamNames(): string[] {
    return Array.from(this.streams.keys());
  }

  /**
   * Get event count for a stream (for debugging/testing)
   */
  getEventCount(streamName: string): number {
    return this.streams.get(streamName)?.length || 0;
  }
}
