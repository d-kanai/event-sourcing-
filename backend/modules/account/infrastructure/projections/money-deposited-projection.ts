import { PrismaClient } from '@prisma/client';
import { DomainEvent } from '../../../shared/domain/events/domain-event';
import { AccountEventType } from '../../domain/events/account-event-type';
import { AggregateProjection } from '../../../shared/infrastructure/projections';
import { Account } from '../../domain/entities/account';
import { AccountId } from '../../domain/value-objects/account-id';

/**
 * Projection for Money Deposited events
 *
 * Pattern: Replay aggregate from Event Store, then sync to read model
 * - No calculation logic here (handled by Rehydrator)
 * - Simply copies latest aggregate state to RDB
 */
export class MoneyDepositedProjection extends AggregateProjection<Account, AccountId> {
  eventType(): string {
    return AccountEventType.MONEY_DEPOSITED;
  }

  protected extractAggregateId(event: DomainEvent): AccountId {
    const data = event.data as any;
    return AccountId.create(data.accountId);
  }

  protected async updateReadModel(account: Account): Promise<void> {
    await this.prisma.account.update({
      where: { id: account.id.getValue() },
      data: {
        balance: account.balance.getValue(),
        status: account.status.getValue(),
      },
    });
  }
}
