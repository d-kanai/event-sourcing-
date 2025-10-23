import { EventStoreDBClient, jsonEvent, StreamNotFoundError } from '@eventstore/db-client';
import { Snapshot, SnapshotRepository } from '../event-store/base-event-sourced-repository';

export class EventStoreSnapshotRepository<T extends Snapshot> implements SnapshotRepository<T> {
  constructor(
    private readonly client: EventStoreDBClient,
    private readonly aggregateType: string
  ) {}

  async save(snapshot: T): Promise<void> {
    const aggregateId = this.extractAggregateId(snapshot);
    const streamName = this.getSnapshotStreamName(aggregateId);

    const snapshotEvent = jsonEvent({
      type: `${this.aggregateType}-snapshot`,
      data: snapshot,
      metadata: {
        snapshotVersion: snapshot.version,
        aggregateType: this.aggregateType,
        aggregateId: aggregateId,
        createdAt: new Date().toISOString(),
      },
    });

    try {
      await this.client.tombstoneStream(streamName);
    } catch (error: any) {
      if (!(error instanceof StreamNotFoundError) && error.type !== 'stream-not-found') {
        throw error;
      }
    }

    await this.client.appendToStream(streamName, snapshotEvent);
  }

  async getLatest(aggregateId: string): Promise<T | null> {
    const streamName = this.getSnapshotStreamName(aggregateId);

    try {
      const events = this.client.readStream(streamName, {
        direction: 'backwards',
        maxCount: 1,
      });

      for await (const resolvedEvent of events) {
        if (resolvedEvent.event?.data) {
          return resolvedEvent.event.data as T;
        }
      }

      return null;
    } catch (error: any) {
      if (error instanceof StreamNotFoundError || error.type === 'stream-not-found') {
        return null;
      }
      throw error;
    }
  }

  async delete(aggregateId: string): Promise<void> {
    const streamName = this.getSnapshotStreamName(aggregateId);

    try {
      await this.client.tombstoneStream(streamName);
    } catch (error: any) {
      if (error instanceof StreamNotFoundError || error.type === 'stream-not-found') {
        return;
      }
      throw error;
    }
  }

  private getSnapshotStreamName(aggregateId: string): string {
    return `snapshot-${this.aggregateType}-${aggregateId}`;
  }

  private extractAggregateId(snapshot: T): string {
    const snapshotAny = snapshot as any;

    const aggregateId =
      snapshotAny[`${this.aggregateType}Id`] ||
      snapshotAny.aggregateId ||
      snapshotAny.id;

    if (!aggregateId) {
      throw new Error(
        `Snapshot must have an aggregateId field (tried: ${this.aggregateType}Id, aggregateId, id)`
      );
    }

    return aggregateId;
  }

  async close(): Promise<void> {
    await this.client.dispose();
  }
}
