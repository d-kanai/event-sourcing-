import { PrismaClient } from '@prisma/client';
import { DomainEvent } from '../../../../shared/domain/events/domain-event';
import { AccountEventType } from '../../domain/events/account-event-type';
import { AggregateProjection } from '../../../../shared/infrastructure/projections';
import { Account } from '../../domain/entities/account';
import { AccountId } from '../../domain/value-objects/account-id';

export class AccountProjection extends AggregateProjection<
  Account,
  AccountId,
  PrismaClient
> {
  private readonly supportedEventTypes = [
    AccountEventType.ACCOUNT_CREATED,
    AccountEventType.MONEY_DEPOSITED,
    AccountEventType.MONEY_WITHDRAWN,
  ];

  eventType(): string {
    return this.supportedEventTypes[0];
  }

  getSupportedEventTypes(): string[] {
    return this.supportedEventTypes;
  }

  protected extractAggregateId(event: DomainEvent): AccountId {
    const data = event.data as any;
    return AccountId.create(data.accountId);
  }

  protected async updateReadModel(account: Account): Promise<void> {
    await this.prisma.account.upsert({
      where: { id: account.id.getValue() },
      create: {
        id: account.id.getValue(),
        userId: account.userId,
        balance: account.balance.getValue(),
        status: account.status.getValue(),
        createdAt: account.createdAt,
      },
      update: {
        balance: account.balance.getValue(),
        status: account.status.getValue(),
      },
    });
  }
}
