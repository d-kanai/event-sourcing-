import { PrismaClient } from '@prisma/client';
import { DomainEvent } from '../../../shared/domain/events/domain-event';
import { AccountEventType } from '../../domain/events/account-event-type';
import { Projection } from '../../../shared/infrastructure/projections';

export class AccountSuspendedProjection implements Projection {
  constructor(private readonly prisma: PrismaClient) {}

  eventType(): string {
    return AccountEventType.ACCOUNT_SUSPENDED;
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
