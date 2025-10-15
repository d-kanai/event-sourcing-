import { PrismaClient } from '@prisma/client';
import { Account } from '../../domain/entities/account';
import { AccountId } from '../../domain/value-objects/account-id';
import { Balance } from '../../domain/value-objects/balance';
import { AccountStatus } from '../../domain/value-objects/account-status';

export class AccountReadRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(account: Account): Promise<void> {
    throw new Error(
      'Write operations are not allowed on AccountReadRepository. Use AccountRepository for writes.'
    );
  }

  async findById(id: AccountId): Promise<Account | null> {
    const record = await this.prisma.account.findUnique({
      where: { id: id.getValue() },
    });

    if (!record) {
      return null;
    }

    return Account.reconstruct(
      AccountId.create(record.id),
      record.userId,
      Balance.create(Number(record.balance)),
      AccountStatus.create(record.status),
      record.createdAt
    );
  }
}
