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
 * Account Repository (CQRS Write Side / Event Sourcing)
 *
 * Responsibilities:
 * - Replay account aggregates from event store (replayById)
 * - Save account aggregates to event store (save)
 * - Project events to read models (eventual consistency)
 * - Create snapshots for performance optimization
 *
 * Event Sourcing Pattern:
 * - Stream naming: "account-{id}"
 * - Uses AccountRehydrator for event replay
 * - Supports AccountSnapshot (every 100 events)
 *
 * CQRS Pattern:
 * - Commands use this repository (replayById + save)
 * - Queries use AccountReadRepository (read from projections)
 *
 * All generic functionality (save, replayById, snapshot logic) is inherited from BaseEventSourcedRepository.
 */
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
