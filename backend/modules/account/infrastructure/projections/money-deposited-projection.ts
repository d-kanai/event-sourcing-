import { PrismaClient } from '@prisma/client';
import { DomainEvent } from '../../../shared/domain/events/domain-event';
import { EventType } from '../../domain/events/event-type';
import { Projection } from './projection';

/**
 * Projection for Money Deposited events
 * Pure Event Sourcing: Calculate new balance from current balance + amount
 */
export class MoneyDepositedProjection implements Projection {
  constructor(private readonly prisma: PrismaClient) {}

  eventType(): string {
    return EventType.MONEY_DEPOSITED;
  }

  async project(event: DomainEvent): Promise<void> {
    const data = event.data as any;

    // Read current balance from read model
    const account = await this.prisma.account.findUnique({
      where: { id: data.accountId },
    });

    if (!account) {
      throw new Error(`Account not found for projection: ${data.accountId}`);
    }

    // Calculate new balance: current balance + deposit amount
    const newBalance = account.balance + data.amount;

    await this.prisma.account.update({
      where: { id: data.accountId },
      data: {
        balance: newBalance,
      },
    });
  }
}
