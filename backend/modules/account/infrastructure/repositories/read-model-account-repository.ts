import { PrismaClient } from '@prisma/client';
import { Account } from '../../domain/entities/account';
import { AccountId } from '../../domain/value-objects/account-id';
import { Balance } from '../../domain/value-objects/balance';
import { AccountStatus } from '../../domain/value-objects/account-status';

export interface ReadModelAccountRepository {
  findById(id: AccountId): Promise<Account | null>;
  findAll(): Promise<Account[]>;
}

export class PrismaReadModelAccountRepository implements ReadModelAccountRepository {
  constructor(private readonly prisma: PrismaClient) {}

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
}
