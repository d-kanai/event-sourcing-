import { AccountSnapshot } from '../snapshots/account-snapshot';
import { SnapshotRepository as BaseSnapshotRepository } from '../../../shared/infrastructure/event-store/base-event-sourced-repository';

export type AccountSnapshotRepository = BaseSnapshotRepository<AccountSnapshot>;
