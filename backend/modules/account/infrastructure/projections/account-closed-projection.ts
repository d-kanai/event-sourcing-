import { PrismaClient } from '@prisma/client';
import { DomainEvent } from '../../../shared/domain/events/domain-event';
import { AccountEventType } from '../../domain/events/account-event-type';
import { Projection } from '../../../shared/infrastructure/projections';

export class AccountClosedProjection implements Projection {
  constructor(private readonly prisma: PrismaClient) {}

  eventType(): string {
    return AccountEventType.ACCOUNT_CLOSED;
  }

  async project(event: DomainEvent): Promise<void> {
    const data = event.data as any;

    await this.prisma.account.update({
      where: { id: data.accountId },
      data: {
        status: 'CLOSED',
      },
    });
  }
}
