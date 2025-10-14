import { PrismaClient } from '@prisma/client';
import { Account } from '../../domain/entities/account';
import { AccountRepository } from '../../domain/repositories/account-repository';
import { AccountId } from '../../domain/value-objects/account-id';
import { Balance } from '../../domain/value-objects/balance';
import { AccountStatus } from '../../domain/value-objects/account-status';

export class PrismaAccountRepository implements AccountRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(account: Account): Promise<void> {
    await this.prisma.account.upsert({
      where: { id: account.id.getValue() },
      create: {
        id: account.id.getValue(),
        balance: account.balance.getValue(),
        status: account.status.getValue(),
        createdAt: account.createdAt,
      },
      update: {
        balance: account.balance.getValue(),
        status: account.status.getValue(),
      },
    });
  }

  async findById(id: AccountId): Promise<Account | null> {
    const record = await this.prisma.account.findUnique({
      where: { id: id.getValue() },
    });

    if (!record) {
      return null;
    }

    return Account.reconstruct({
      id: AccountId.create(record.id),
      balance: Balance.create(Number(record.balance)),
      status: AccountStatus.create(record.status),
      createdAt: record.createdAt,
    });
  }

  async findAll(): Promise<Account[]> {
    const records = await this.prisma.account.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return records.map((record) =>
      Account.reconstruct({
        id: AccountId.create(record.id),
        balance: Balance.create(Number(record.balance)),
        status: AccountStatus.create(record.status),
        createdAt: record.createdAt,
      })
    );
  }

  async delete(id: AccountId): Promise<void> {
    await this.prisma.account.delete({
      where: { id: id.getValue() },
    });
  }
}
