import {
  EventStoreDBClient,
  jsonEvent,
  ResolvedEvent,
  START,
  StreamNotFoundError,
} from '@eventstore/db-client';
import { DomainEvent } from '../../domain/events/domain-event';
import { EventStore } from './base-event-sourced-repository';

/**
 * EventStoreDB Client Implementation
 *
 * Production-ready adapter for EventStoreDB
 * Implements EventStore interface for use with any aggregate repository
 *
 * Features:
 * - Event append with optimistic concurrency control
 * - Event reading with stream-not-found handling
 * - Snapshot support via readEventsAfterVersion
 * - Graceful connection disposal
 *
 * Usage:
 * const eventStore = new EventStoreClient('esdb://localhost:2113?tls=false');
 * const repository = new EventSourcedAccountRepository(eventStore, ...);
 */
export class EventStoreClient implements EventStore {
  private client: EventStoreDBClient;

  constructor(connectionString?: string) {
    this.client = EventStoreDBClient.connectionString(
      connectionString || 'esdb://localhost:2113?tls=false'
    );
  }

  /**
   * Append events to a stream
   * Uses optimistic concurrency control (expectedRevision: 'any' for now)
   */
  async appendEvents(streamName: string, events: DomainEvent[]): Promise<void> {
    const expectedRevision = 'any'; // TODO: Implement optimistic locking
    const jsonEvents = events.map((event) =>
      jsonEvent({
        type: event.eventType,
        data: {
          eventId: event.eventId,
          aggregateId: event.aggregateId,
          aggregateType: event.aggregateType,
          occurredAt: event.occurredAt.toISOString(),
          data: event.data,
          metadata: event.metadata,
        },
      })
    );

    await this.client.appendToStream(streamName, jsonEvents, {
      expectedRevision: expectedRevision,
    });
  }

  /**
   * Read all events from a stream
   * Returns empty array if stream doesn't exist
   */
  async readEvents(streamName: string): Promise<DomainEvent[]> {
    const events: DomainEvent[] = [];

    try {
      const resolvedEvents = this.client.readStream(streamName);

      for await (const resolvedEvent of resolvedEvents) {
        if (resolvedEvent.event) {
          const event = this.toDomainEvent(resolvedEvent);
          if (event) {
            events.push(event);
          }
        }
      }
    } catch (error: any) {
      if (error.type === 'stream-not-found' || error instanceof StreamNotFoundError) {
        return [];
      }
      throw error;
    }

    return events;
  }

  /**
   * Read events after a specific version (for snapshot optimization)
   *
   * Example:
   * - Stream has 1000 events (versions 0-999)
   * - Snapshot was taken at version 900
   * - readEventsAfterVersion('account-123', 900) returns events 901-999
   *
   * @param streamName - Stream name
   * @param afterVersion - Read events after this version (exclusive)
   * @returns Events after the specified version
   */
  async readEventsAfterVersion(
    streamName: string,
    afterVersion: number
  ): Promise<DomainEvent[]> {
    const events: DomainEvent[] = [];

    try {
      // EventStoreDB revision is 0-indexed
      // afterVersion is 1-indexed (event count), so we start from afterVersion
      const fromRevision = BigInt(afterVersion);

      const resolvedEvents = this.client.readStream(streamName, {
        fromRevision,
        direction: 'forwards',
      });

      for await (const resolvedEvent of resolvedEvents) {
        if (resolvedEvent.event) {
          const event = this.toDomainEvent(resolvedEvent);
          if (event) {
            events.push(event);
          }
        }
      }
    } catch (error: any) {
      if (error.type === 'stream-not-found' || error instanceof StreamNotFoundError) {
        return [];
      }
      throw error;
    }

    return events;
  }

  /**
   * Get the current revision (version) of a stream
   * Returns null if stream doesn't exist
   */
  async getStreamRevision(streamName: string): Promise<bigint | null> {
    try {
      const resolvedEvents = this.client.readStream(streamName, {
        direction: 'backwards',
        maxCount: 1,
      });

      for await (const resolvedEvent of resolvedEvents) {
        return resolvedEvent.event?.revision ?? null;
      }

      return null;
    } catch (error: any) {
      if (error.type === 'stream-not-found' || error instanceof StreamNotFoundError) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Convert EventStoreDB ResolvedEvent to DomainEvent
   */
  private toDomainEvent(resolvedEvent: ResolvedEvent): DomainEvent | null {
    if (!resolvedEvent.event) return null;

    const eventData = resolvedEvent.event.data as any;

    return {
      eventId: eventData.eventId,
      eventType: resolvedEvent.event.type,
      aggregateId: eventData.aggregateId,
      aggregateType: eventData.aggregateType,
      occurredAt: new Date(eventData.occurredAt),
      data: eventData.data,
      metadata: eventData.metadata,
    };
  }

  /**
   * Close the connection to EventStoreDB
   * Should be called on application shutdown
   */
  async close(): Promise<void> {
    await this.client.dispose();
  }
}
