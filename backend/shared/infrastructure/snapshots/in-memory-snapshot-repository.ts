import { Snapshot, SnapshotRepository } from '../event-store/base-event-sourced-repository';

export class InMemorySnapshotRepository<T extends Snapshot> implements SnapshotRepository<T> {
  private snapshots: Map<string, T> = new Map();

  async save(snapshot: T): Promise<void> {
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

  clear(): void {
    this.snapshots.clear();
  }

  getAggregateIds(): string[] {
    return Array.from(this.snapshots.keys());
  }

  getCount(): number {
    return this.snapshots.size;
  }
}
