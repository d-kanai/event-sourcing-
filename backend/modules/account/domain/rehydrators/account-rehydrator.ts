import { Account } from '../entities/account';
import { AccountId } from '../value-objects/account-id';
import { Balance } from '../value-objects/balance';
import { AccountStatus } from '../value-objects/account-status';
import { DomainEvent } from '../../../shared/domain/events/domain-event';
import { EventType } from '../events/event-type';

/**
 * Rehydrator for reconstructing Account aggregates from events
 * Encapsulates event rehydration logic separate from business logic
 *
 * This class is the counterpart to AccountFactory:
 * - AccountFactory: Creates new accounts (forward flow)
 * - AccountRehydrator: Rehydrates accounts from event history (backward flow)
 */
export class AccountRehydrator {
  /**
   * Rehydrate account from event stream
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
   * Replay single event to account state
   * Encapsulates the knowledge of how each event type affects state
   *
   * @param account - Account instance to mutate
   * @param event - Domain event to replay
   */
  private static replayEvent(account: Account, event: DomainEvent): void {
    const eventData = event.data as any;

    switch (event.eventType) {
      case EventType.MONEY_DEPOSITED:
        account.applyBalanceChange(Balance.create(eventData.balanceAfter));
        break;

      case EventType.MONEY_WITHDRAWN:
        account.applyBalanceChange(Balance.create(eventData.balanceAfter));
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
