import { Account } from '../entities/account';
import { AccountId } from '../value-objects/account-id';
import { Balance } from '../value-objects/balance';
import { AccountStatus } from '../value-objects/account-status';
import { DomainEvent } from '../../../shared/domain/events/domain-event';
import { EventType } from '../events/event-type';
import { AccountSnapshot } from '../snapshots/account-snapshot';

/**
 * Rehydrator for reconstructing Account aggregates from events
 * Encapsulates event rehydration logic separate from business logic
 *
 * Supports Pure Event Sourcing + Snapshot pattern:
 * - Without snapshot: Replay all events from beginning
 * - With snapshot: Start from snapshot + replay events after snapshot
 *
 * This class is the counterpart to AccountFactory:
 * - AccountFactory: Creates new accounts (forward flow)
 * - AccountRehydrator: Rehydrates accounts from event history (backward flow)
 */
export class AccountRehydrator {
  /**
   * Rehydrate account from event stream (without snapshot)
   *
   * @param events - Ordered list of domain events for the account
   * @returns Rehydrated account instance
   * @throws Error if events are invalid or empty
   */
  static rehydrate(events: DomainEvent[]): Account {
    if (events.length === 0) {
      throw new Error('No events to replay');
    }

    const firstEvent = events[0];
    if (firstEvent.eventType !== EventType.ACCOUNT_CREATED) {
      throw new Error('First event must be AccountCreated');
    }

    // Rehydrate initial state from first event
    const eventData = firstEvent.data as any;
    const account = Account.reconstruct(
      AccountId.create(eventData.accountId),
      Balance.create(eventData.initialBalance),
      AccountStatus.create(eventData.status),
      new Date(eventData.createdAt)
    );

    // Replay remaining events to rehydrate state
    for (let i = 1; i < events.length; i++) {
      this.replayEvent(account, events[i]);
    }

    return account;
  }

  /**
   * Rehydrate account using snapshot + events
   * Performance optimization: Start from snapshot instead of replaying all events
   *
   * Example: 10,000 events total
   * - Without snapshot: Replay all 10,000 events
   * - With snapshot at 9,900: Load snapshot + replay 100 events
   *
   * @param snapshot - Latest snapshot (state at specific version)
   * @param eventsAfterSnapshot - Events that occurred after the snapshot
   * @returns Rehydrated account instance
   */
  static rehydrateFromSnapshot(
    snapshot: AccountSnapshot,
    eventsAfterSnapshot: DomainEvent[]
  ): Account {
    // Reconstruct account from snapshot
    const account = Account.reconstruct(
      AccountId.create(snapshot.accountId),
      Balance.create(snapshot.balance),
      AccountStatus.create(snapshot.status),
      new Date(snapshot.createdAt)
    );

    // Replay events that occurred after snapshot
    for (const event of eventsAfterSnapshot) {
      this.replayEvent(account, event);
    }

    return account;
  }

  /**
   * Create snapshot from current account state
   * Should be called periodically (e.g., every 100 events)
   *
   * @param account - Account to snapshot
   * @param version - Event version (number of events applied)
   * @returns Snapshot of current state
   */
  static createSnapshot(account: Account, version: number): AccountSnapshot {
    return AccountSnapshot.create(
      account.id.getValue(),
      account.balance.getValue(),
      account.status.getValue(),
      account.createdAt.toISOString(),
      version
    );
  }

  /**
   * Replay single event to account state
   * Pure Event Sourcing: Calculate state from facts (amount), not from stored results (balanceAfter)
   * This allows for:
   * - Restoring to any point in time accurately
   * - Adapting to business rule changes
   * - Maintaining complete audit trail
   *
   * @param account - Account instance to mutate
   * @param event - Domain event to replay
   */
  private static replayEvent(account: Account, event: DomainEvent): void {
    const eventData = event.data as any;

    switch (event.eventType) {
      case EventType.MONEY_DEPOSITED:
        // Calculate new balance from current balance + amount
        const newBalanceAfterDeposit = account.balance.add(eventData.amount);
        account.applyBalanceChange(newBalanceAfterDeposit);
        break;

      case EventType.MONEY_WITHDRAWN:
        // Calculate new balance from current balance - amount
        const newBalanceAfterWithdraw = account.balance.subtract(eventData.amount);
        account.applyBalanceChange(newBalanceAfterWithdraw);
        break;

      case EventType.ACCOUNT_SUSPENDED:
        account.applyStatusChange(AccountStatus.suspended());
        break;

      case EventType.ACCOUNT_ACTIVATED:
        account.applyStatusChange(AccountStatus.active());
        break;

      case EventType.ACCOUNT_CLOSED:
        account.applyStatusChange(AccountStatus.closed());
        break;

      default:
        throw new Error(`Unknown event type: ${event.eventType}`);
    }
  }
}
