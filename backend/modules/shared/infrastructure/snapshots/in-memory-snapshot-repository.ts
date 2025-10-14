import { Snapshot, SnapshotRepository } from '../event-store/base-event-sourced-repository';

/**
 * In-Memory Snapshot Repository
 *
 * Generic in-memory implementation for testing
 * Stores snapshots in Map<aggregateId, Snapshot>
 *
 * Usage:
 * ```typescript
 * const snapshotRepo = new InMemorySnapshotRepository<AccountSnapshot>();
 * const writeRepo = new AccountWriteRepository(eventStore, projectionRegistry, snapshotRepo);
 * ```
 *
 * Production alternatives:
 * - Redis: Fast cache layer for snapshots
 * - PostgreSQL/MySQL: Persistent storage
 * - EventStoreDB: Built-in snapshot support
 */
export class InMemorySnapshotRepository<T extends Snapshot> implements SnapshotRepository<T> {
  private snapshots: Map<string, T> = new Map();

  async save(snapshot: T): Promise<void> {
    // Extract aggregateId from snapshot
    // Snapshots should have aggregateId field (e.g., AccountSnapshot.accountId)
    const aggregateId = (snapshot as any).accountId || (snapshot as any).orderId || (snapshot as any).id;

    if (!aggregateId) {
      throw new Error('Snapshot must have an aggregateId field');
    }

    this.snapshots.set(aggregateId, snapshot);
  }

  async getLatest(aggregateId: string): Promise<T | null> {
    return this.snapshots.get(aggregateId) || null;
  }

  async delete(aggregateId: string): Promise<void> {
    this.snapshots.delete(aggregateId);
  }

  /**
   * Clear all snapshots (for test cleanup)
   */
  clear(): void {
    this.snapshots.clear();
  }

  /**
   * Get all aggregate IDs with snapshots (for debugging)
   */
  getAggregateIds(): string[] {
    return Array.from(this.snapshots.keys());
  }

  /**
   * Get snapshot count (for debugging/testing)
   */
  getCount(): number {
    return this.snapshots.size;
  }
}
