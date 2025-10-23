import { Snapshot } from '../../../../shared/infrastructure/event-store/base-event-sourced-repository';

export interface UserSnapshotData {
  userId: string;
  email: string;
  name: string;
  status: string;
  createdAt: string;
  version: number;
  snapshotAt: string;
}

export class UserSnapshot implements Snapshot {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly name: string,
    public readonly status: string,
    public readonly createdAt: string,
    public readonly version: number,
    public readonly snapshotAt: Date
  ) {}

  static create(
    userId: string,
    email: string,
    name: string,
    status: string,
    createdAt: string,
    version: number
  ): UserSnapshot {
    return new UserSnapshot(
      userId,
      email,
      name,
      status,
      createdAt,
      version,
      new Date()
    );
  }

  toJSON(): UserSnapshotData {
    return {
      userId: this.userId,
      email: this.email,
      name: this.name,
      status: this.status,
      createdAt: this.createdAt,
      version: this.version,
      snapshotAt: this.snapshotAt.toISOString(),
    };
  }

  static fromJSON(data: UserSnapshotData): UserSnapshot {
    return new UserSnapshot(
      data.userId,
      data.email,
      data.name,
      data.status,
      data.createdAt,
      data.version,
      new Date(data.snapshotAt)
    );
  }
}
