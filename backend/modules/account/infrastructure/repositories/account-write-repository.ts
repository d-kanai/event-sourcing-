import { Account } from '../../domain/entities/account';
import { AccountId } from '../../domain/value-objects/account-id';
import { AccountRehydrator } from '../../domain/rehydrators/account-rehydrator';
import { AccountSnapshot } from '../../domain/snapshots/account-snapshot';
import { AccountSnapshotRepository } from '../../domain/repositories/account-snapshot-repository';
import {
  BaseEventSourcedRepository,
  EventStore,
  ProjectionRegistry,
} from '../../../shared/infrastructure/event-store/base-event-sourced-repository';

/**
 * Account Write Repository (CQRS Write Side)
 *
 * Responsibilities:
 * - Save Account aggregates to event store
 * - Project events to read models (eventual consistency)
 * - Create snapshots for performance optimization
 *
 * Event Sourcing Pattern:
 * - Stream naming: "account-{id}"
 * - Uses AccountRehydrator for event replay
 * - Supports AccountSnapshot (every 100 events)
 *
 * CQRS Pattern:
 * - Write side: Stores events (source of truth)
 * - Commands use this repository (CreateAccount, Deposit, Withdraw)
 * - Queries use AccountReadRepository (GetAccount)
 *
 * All generic functionality (save, findById, snapshot logic) is inherited from BaseEventSourcedRepository.
 */
export class AccountWriteRepository extends BaseEventSourcedRepository<
  Account,
  AccountId,
  AccountSnapshot
> {
  constructor(
    eventStore: EventStore,
    projectionRegistry?: ProjectionRegistry,
    snapshotRepository?: AccountSnapshotRepository
  ) {
    // AccountRehydrator is stateless, can be passed directly
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
