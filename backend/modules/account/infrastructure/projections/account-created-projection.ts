import { PrismaClient } from '@prisma/client';
import { DomainEvent } from '../../../shared/domain/events/domain-event';
import { AccountEventType } from '../../domain/events/account-event-type';
import { AggregateProjection } from '../../../shared/infrastructure/projections';
import { Account } from '../../domain/entities/account';
import { AccountId } from '../../domain/value-objects/account-id';

/**
 * Projection for Account Created events
 *
 * Pattern: Replay aggregate from Event Store, then sync to read model
 * - Creates initial record in read DB
 * - Uses replayed aggregate state (not event data directly)
 */
export class AccountCreatedProjection extends AggregateProjection<Account, AccountId> {
  eventType(): string {
    return AccountEventType.ACCOUNT_CREATED;
  }

  protected extractAggregateId(event: DomainEvent): AccountId {
    const data = event.data as any;
    return AccountId.create(data.accountId);
  }

  protected async updateReadModel(account: Account): Promise<void> {
    // Create initial record in read DB with aggregate's state
    await this.prisma.account.create({
      data: {
        id: account.id.getValue(),
        balance: account.balance.getValue(),
        status: account.status.getValue(),
        createdAt: account.createdAt,
      },
    });
  }
}
