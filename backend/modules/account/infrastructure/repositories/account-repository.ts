import { Account } from '../../domain/entities/account';
import { AccountId } from '../../domain/value-objects/account-id';
import { AccountRehydrator } from '../../domain/rehydrators/account-rehydrator';
import { AccountSnapshot } from '../../domain/snapshots/account-snapshot';
import { AccountSnapshotRepository } from '../../domain/repositories/account-snapshot-repository';
import {
  BaseEventSourcedRepository,
  EventStore,
  ProjectionRegistry,
} from '../../../../shared/infrastructure/event-store/base-event-sourced-repository';

export class AccountRepository extends BaseEventSourcedRepository<
  Account,
  AccountId,
  AccountSnapshot
> {
  constructor(
    eventStore: EventStore,
    projectionRegistry?: ProjectionRegistry,
    snapshotRepository?: AccountSnapshotRepository
  ) {
    const rehydrator = AccountRehydrator;
    super(eventStore, rehydrator, projectionRegistry, snapshotRepository);
  }

  protected getStreamName(id: AccountId): string {
    return `account-${id.getValue()}`;
  }

  protected extractIdValue(id: AccountId): string {
    return id.getValue();
  }

  protected extractId(aggregate: Account): AccountId {
    return aggregate.id;
  }
}
