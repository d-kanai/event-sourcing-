import { PrismaClient } from '@prisma/client';
import { DomainEvent } from '../../../shared/domain/events/domain-event';
import { EventType } from '../../domain/events/event-type';
import { Projection } from './projection';

export class AccountCreatedProjection implements Projection {
  constructor(private readonly prisma: PrismaClient) {}

  eventType(): string {
    return EventType.ACCOUNT_CREATED;
  }

  async project(event: DomainEvent): Promise<void> {
    const data = event.data as any;

    await this.prisma.account.create({
      data: {
        id: data.accountId,
        balance: data.initialBalance,
        status: data.status,
        createdAt: new Date(data.createdAt),
      },
    });
  }
}
