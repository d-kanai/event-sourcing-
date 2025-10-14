import { Snapshot } from '../../../shared/infrastructure/event-store/base-event-sourced-repository';

/**
 * Account Snapshot for Performance Optimization
 *
 * Pure Event Sourcing requires replaying all events from the beginning,
 * which becomes slow as event history grows. Snapshots solve this:
 *
 * Without Snapshot: Replay 10,000 events every time
 * With Snapshot: Load snapshot at event 9,900 + replay last 100 events
 *
 * Industry practice: Snapshot every 100-200 events (Axon Framework uses 100)
 */

export interface AccountSnapshotData {
  accountId: string;
  balance: number;
  status: string;
  createdAt: string;
  // Snapshot metadata
  version: number; // Event version at which snapshot was taken
  snapshotAt: string; // Timestamp when snapshot was created
}

export class AccountSnapshot implements Snapshot {
  constructor(
    public readonly accountId: string,
    public readonly balance: number,
    public readonly status: string,
    public readonly createdAt: string,
    public readonly version: number,
    public readonly snapshotAt: Date
  ) {}

  static create(
    accountId: string,
    balance: number,
    status: string,
    createdAt: string,
    version: number
  ): AccountSnapshot {
    return new AccountSnapshot(
      accountId,
      balance,
      status,
      createdAt,
      version,
      new Date()
    );
  }

  toJSON(): AccountSnapshotData {
    return {
      accountId: this.accountId,
      balance: this.balance,
      status: this.status,
      createdAt: this.createdAt,
      version: this.version,
      snapshotAt: this.snapshotAt.toISOString(),
    };
  }

  static fromJSON(data: AccountSnapshotData): AccountSnapshot {
    return new AccountSnapshot(
      data.accountId,
      data.balance,
      data.status,
      data.createdAt,
      data.version,
      new Date(data.snapshotAt)
    );
  }
}
