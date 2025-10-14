import { PrismaClient } from '@prisma/client';
import { DomainEvent } from '../../domain/events/domain-event';
import { EventType } from '../../domain/events/event-type';
import { Projection } from './projection';

export class AccountSuspendedProjection implements Projection {
  constructor(private readonly prisma: PrismaClient) {}

  eventType(): string {
    return EventType.ACCOUNT_SUSPENDED;
  }

  async project(event: DomainEvent): Promise<void> {
    const data = event.data as any;

    await this.prisma.account.update({
      where: { id: data.accountId },
      data: {
        status: 'SUSPENDED',
      },
    });
  }
}
