import { PrismaClient } from '@prisma/client';
import { Account } from '../../domain/entities/account';
import { AccountId } from '../../domain/value-objects/account-id';
import { Balance } from '../../domain/value-objects/balance';
import { AccountStatus } from '../../domain/value-objects/account-status';

/**
 * Read-only repository for querying account data from SQLite.
 * DO NOT use save() - all writes must go through EventSourcedAccountRepository.
 */
export class PrismaAccountRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(account: Account): Promise<void> {
    throw new Error(
      'Write operations are not allowed on PrismaAccountRepository. Use EventSourcedAccountRepository for writes.'
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
      Balance.create(Number(record.balance)),
      AccountStatus.create(record.status),
      record.createdAt
    );
  }
}
