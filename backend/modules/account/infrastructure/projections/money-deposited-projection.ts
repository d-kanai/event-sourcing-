import { PrismaClient } from '@prisma/client';
import { DomainEvent } from '../../domain/events/domain-event';
import { Projection } from './projection';

export class MoneyDepositedProjection implements Projection {
  constructor(private readonly prisma: PrismaClient) {}

  eventType(): string {
    return 'MoneyDeposited';
  }

  async project(event: DomainEvent): Promise<void> {
    const data = event.data as any;

    await this.prisma.account.update({
      where: { id: data.accountId },
      data: {
        balance: data.balanceAfter,
      },
    });
  }
}
