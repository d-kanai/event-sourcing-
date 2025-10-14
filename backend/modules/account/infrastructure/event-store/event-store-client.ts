import {
  EventStoreDBClient,
  jsonEvent,
  JSONEventType,
  ResolvedEvent,
} from '@eventstore/db-client';
import { DomainEvent } from '../../domain/events/domain-event';

export class EventStoreClient {
  private client: EventStoreDBClient;

  constructor(connectionString?: string) {
    this.client = EventStoreDBClient.connectionString(
      connectionString || 'esdb://localhost:2113?tls=false'
    );
  }

  async appendEvents(
    streamName: string,
    events: DomainEvent[],
    expectedRevision?: bigint
  ): Promise<void> {
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
      expectedRevision: expectedRevision ?? 'any',
    });
  }

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
      if (error.type === 'stream-not-found') {
        return [];
      }
      throw error;
    }

    return events;
  }

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
      if (error.type === 'stream-not-found') {
        return null;
      }
      throw error;
    }
  }

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

  async close(): Promise<void> {
    await this.client.dispose();
  }
}
