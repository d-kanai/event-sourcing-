import { PrismaClient } from '@prisma/client';
import { DomainEvent } from '../../domain/events/domain-event';

export class AccountProjection {
  constructor(private readonly prisma: PrismaClient) {}

  async project(event: DomainEvent): Promise<void> {
    const eventData = event.data as any;

    switch (event.eventType) {
      case 'AccountCreated':
        await this.handleAccountCreated(eventData);
        break;

      case 'MoneyDeposited':
        await this.handleMoneyDeposited(eventData);
        break;

      case 'MoneyWithdrawn':
        await this.handleMoneyWithdrawn(eventData);
        break;

      case 'AccountSuspended':
        await this.handleAccountSuspended(eventData);
        break;

      case 'AccountActivated':
        await this.handleAccountActivated(eventData);
        break;

      case 'AccountClosed':
        await this.handleAccountClosed(eventData);
        break;
    }
  }

  private async handleAccountCreated(data: any): Promise<void> {
    await this.prisma.account.create({
      data: {
        id: data.accountId,
        balance: data.initialBalance,
        status: data.status,
        createdAt: new Date(data.createdAt),
      },
    });
  }

  private async handleMoneyDeposited(data: any): Promise<void> {
    await this.prisma.account.update({
      where: { id: data.accountId },
      data: {
        balance: data.balanceAfter,
      },
    });
  }

  private async handleMoneyWithdrawn(data: any): Promise<void> {
    await this.prisma.account.update({
      where: { id: data.accountId },
      data: {
        balance: data.balanceAfter,
      },
    });
  }

  private async handleAccountSuspended(data: any): Promise<void> {
    await this.prisma.account.update({
      where: { id: data.accountId },
      data: {
        status: 'SUSPENDED',
      },
    });
  }

  private async handleAccountActivated(data: any): Promise<void> {
    await this.prisma.account.update({
      where: { id: data.accountId },
      data: {
        status: 'ACTIVE',
      },
    });
  }

  private async handleAccountClosed(data: any): Promise<void> {
    await this.prisma.account.update({
      where: { id: data.accountId },
      data: {
        status: 'CLOSED',
      },
    });
  }
}
