import { PrismaClient } from '@prisma/client';
import { Account } from '../../domain/entities/account';
import { AccountId } from '../../domain/value-objects/account-id';
import { Balance } from '../../domain/value-objects/balance';
import { AccountStatus } from '../../domain/value-objects/account-status';

/**
 * Account Read Repository (CQRS Read Side)
 *
 * Responsibilities:
 * - Query account data from read model (SQLite/Prisma)
 * - Optimized for queries (indexed, denormalized)
 * - Eventually consistent with event store
 *
 * CQRS Pattern:
 * - Read side: Queries from projected read model
 * - Queries use this repository (GetAccountQuery)
 * - Commands use AccountRepository
 *
 * Read Model Update Flow:
 * 1. Command writes events to event store (AccountRepository)
 * 2. Events are projected to read model (Projections)
 * 3. Queries read from read model (AccountReadRepository)
 *
 * Important:
 * - DO NOT use save() - all writes must go through AccountRepository
 * - Read model is updated via projections, not directly
 */
export class AccountReadRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Save is not allowed on read repository
   * Write operations must go through AccountRepository (event store)
   */
  async save(account: Account): Promise<void> {
    throw new Error(
      'Write operations are not allowed on AccountReadRepository. Use AccountRepository for writes.'
    );
  }

  /**
   * Find account by ID from read model
   * Returns null if account doesn't exist
   *
   * @param id - Account ID value object
   * @returns Account aggregate or null
   */
  async findById(id: AccountId): Promise<Account | null> {
    const record = await this.prisma.account.findUnique({
      where: { id: id.getValue() },
    });

    if (!record) {
      return null;
    }

    // Reconstruct Account aggregate from read model data
    return Account.reconstruct(
      AccountId.create(record.id),
      Balance.create(Number(record.balance)),
      AccountStatus.create(record.status),
      record.createdAt
    );
  }
}
