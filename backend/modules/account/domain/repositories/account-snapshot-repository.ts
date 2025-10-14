import { AccountSnapshot } from '../snapshots/account-snapshot';
import { SnapshotRepository as BaseSnapshotRepository } from '../../../shared/infrastructure/event-store/base-event-sourced-repository';

/**
 * Account Snapshot Repository
 *
 * Type alias for AccountSnapshot-specific repository
 * Provides type-safe interface for storing and retrieving account snapshots
 *
 * Implementations:
 * - InMemoryAccountSnapshotRepository (testing)
 * - RedisAccountSnapshotRepository (production - cache layer)
 * - PrismaAccountSnapshotRepository (production - database)
 *
 * Snapshots are performance optimization artifacts, not domain logic.
 * If snapshot is unavailable, system can always fall back to replaying all events.
 *
 * Usage:
 * ```typescript
 * const snapshotRepo: AccountSnapshotRepository = new InMemoryAccountSnapshotRepository();
 * const writeRepo = new AccountWriteRepository(eventStore, projectionRegistry, snapshotRepo);
 * ```
 */
export type AccountSnapshotRepository = BaseSnapshotRepository<AccountSnapshot>;
