import { Snapshot } from '../../../../shared/infrastructure/event-store/base-event-sourced-repository';

export interface AccountSnapshotData {
  accountId: string;
  userId: string;
  balance: number;
  status: string;
  createdAt: string;
  version: number;
  snapshotAt: string;
}

export class AccountSnapshot implements Snapshot {
  constructor(
    public readonly accountId: string,
    public readonly userId: string,
    public readonly balance: number,
    public readonly status: string,
    public readonly createdAt: string,
    public readonly version: number,
    public readonly snapshotAt: Date
  ) {}

  static create(
    accountId: string,
    userId: string,
    balance: number,
    status: string,
    createdAt: string,
    version: number
  ): AccountSnapshot {
    return new AccountSnapshot(
      accountId,
      userId,
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
      userId: this.userId,
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
      data.userId,
      data.balance,
      data.status,
      data.createdAt,
      data.version,
      new Date(data.snapshotAt)
    );
  }
}
