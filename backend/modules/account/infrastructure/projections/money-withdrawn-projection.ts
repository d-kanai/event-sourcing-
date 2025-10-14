import { PrismaClient } from '@prisma/client';
import { DomainEvent } from '../../domain/events/domain-event';
import { Projection } from './projection';

export class MoneyWithdrawnProjection implements Projection {
  constructor(private readonly prisma: PrismaClient) {}

  eventType(): string {
    return 'MoneyWithdrawn';
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
