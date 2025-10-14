import { EventStoreDBClient, jsonEvent, StreamNotFoundError } from '@eventstore/db-client';
import { Snapshot, SnapshotRepository } from '../event-store/base-event-sourced-repository';

/**
 * EventStoreDB Snapshot Repository
 *
 * Stores snapshots in EventStoreDB using dedicated snapshot streams
 * Stream naming convention: "snapshot-{aggregateType}-{aggregateId}"
 *
 * Features:
 * - Snapshots stored as events in EventStoreDB
 * - Only stores latest snapshot (overwrites previous)
 * - Consistent with event store infrastructure
 * - No additional database required
 *
 * Stream structure:
 * - Event stream: "account-123" → Events
 * - Snapshot stream: "snapshot-account-123" → Snapshots
 *
 * Usage:
 * ```typescript
 * const client = EventStoreDBClient.connectionString('esdb://localhost:2113?tls=false');
 * const snapshotRepo = new EventStoreSnapshotRepository<AccountSnapshot>(client, 'account');
 * const writeRepo = new AccountWriteRepository(eventStore, projectionRegistry, snapshotRepo);
 * ```
 *
 * EventStoreDB best practices:
 * - Use separate streams for snapshots
 * - Store only latest snapshot per aggregate
 * - Set metadata for snapshot identification
 */
export class EventStoreSnapshotRepository<T extends Snapshot> implements SnapshotRepository<T> {
  constructor(
    private readonly client: EventStoreDBClient,
    private readonly aggregateType: string // e.g., 'account', 'order'
  ) {}

  async save(snapshot: T): Promise<void> {
    // Extract aggregateId from snapshot
    const aggregateId = this.extractAggregateId(snapshot);
    const streamName = this.getSnapshotStreamName(aggregateId);

    // Create snapshot event
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

    // Delete old snapshots and write new one (keep only latest)
    // Strategy: Truncate stream and append new snapshot
    try {
      // Truncate the stream (delete all events)
      await this.client.tombstoneStream(streamName);
    } catch (error: any) {
      // Stream doesn't exist yet, that's fine
      if (!(error instanceof StreamNotFoundError) && error.type !== 'stream-not-found') {
        throw error;
      }
    }

    // Append new snapshot to fresh stream
    await this.client.appendToStream(streamName, snapshotEvent);
  }

  async getLatest(aggregateId: string): Promise<T | null> {
    const streamName = this.getSnapshotStreamName(aggregateId);

    try {
      // Read latest snapshot from stream (backwards, limit 1)
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
      // Hard delete the snapshot stream
      await this.client.tombstoneStream(streamName);
    } catch (error: any) {
      if (error instanceof StreamNotFoundError || error.type === 'stream-not-found') {
        // Already deleted or never existed
        return;
      }
      throw error;
    }
  }

  /**
   * Get snapshot stream name
   * Convention: "snapshot-{aggregateType}-{aggregateId}"
   */
  private getSnapshotStreamName(aggregateId: string): string {
    return `snapshot-${this.aggregateType}-${aggregateId}`;
  }

  /**
   * Extract aggregateId from snapshot
   * Supports common naming patterns: accountId, orderId, id, etc.
   */
  private extractAggregateId(snapshot: T): string {
    const snapshotAny = snapshot as any;

    // Try common ID field names
    const aggregateId =
      snapshotAny[`${this.aggregateType}Id`] || // e.g., accountId, orderId
      snapshotAny.aggregateId ||
      snapshotAny.id;

    if (!aggregateId) {
      throw new Error(
        `Snapshot must have an aggregateId field (tried: ${this.aggregateType}Id, aggregateId, id)`
      );
    }

    return aggregateId;
  }

  /**
   * Close the EventStoreDB connection
   * Should be called on application shutdown
   */
  async close(): Promise<void> {
    await this.client.dispose();
  }
}
