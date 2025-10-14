import { SnapshotRepository } from '../../domain/repositories/snapshot-repository';
import { AccountSnapshot } from '../../domain/snapshots/account-snapshot';

/**
 * In-Memory Snapshot Repository for Testing
 * Production implementation would use a database or cache (Redis, etc.)
 */
export class InMemorySnapshotRepository implements SnapshotRepository {
  private snapshots: Map<string, AccountSnapshot> = new Map();

  async save(snapshot: AccountSnapshot): Promise<void> {
    this.snapshots.set(snapshot.accountId, snapshot);
  }

  async getLatest(accountId: string): Promise<AccountSnapshot | null> {
    return this.snapshots.get(accountId) || null;
  }

  async delete(accountId: string): Promise<void> {
    this.snapshots.delete(accountId);
  }

  // Test helper
  clear(): void {
    this.snapshots.clear();
  }
}
