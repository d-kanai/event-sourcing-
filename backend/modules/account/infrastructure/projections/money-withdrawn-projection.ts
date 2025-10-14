import { PrismaClient } from '@prisma/client';
import { DomainEvent } from '../../../shared/domain/events/domain-event';
import { EventType } from '../../domain/events/event-type';
import { Projection } from './projection';

export class MoneyWithdrawnProjection implements Projection {
  constructor(private readonly prisma: PrismaClient) {}

  eventType(): string {
    return EventType.MONEY_WITHDRAWN;
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
