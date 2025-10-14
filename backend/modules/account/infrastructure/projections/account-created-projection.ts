import { PrismaClient } from '@prisma/client';
import { DomainEvent } from '../../domain/events/domain-event';
import { Projection } from './projection';

export class AccountCreatedProjection implements Projection {
  constructor(private readonly prisma: PrismaClient) {}

  eventType(): string {
    return 'AccountCreated';
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
