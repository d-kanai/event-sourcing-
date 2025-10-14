import { AccountSnapshot } from '../snapshots/account-snapshot';

/**
 * Repository interface for storing and retrieving account snapshots
 *
 * Snapshots are performance optimization artifacts, not domain logic.
 * If snapshot is unavailable, system can always fall back to replaying all events.
 */
export interface SnapshotRepository {
  /**
   * Save a snapshot for an account
   * @param snapshot - The snapshot to save
   */
  save(snapshot: AccountSnapshot): Promise<void>;

  /**
   * Get the latest snapshot for an account
   * @param accountId - The account ID
   * @returns The latest snapshot, or null if no snapshot exists
   */
  getLatest(accountId: string): Promise<AccountSnapshot | null>;

  /**
   * Delete all snapshots for an account
   * @param accountId - The account ID
   */
  delete(accountId: string): Promise<void>;
}
