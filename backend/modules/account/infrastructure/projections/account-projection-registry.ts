import { PrismaClient } from '@prisma/client';
import { ProjectionRegistry } from '../../../shared/infrastructure/projections';
import { AccountCreatedProjection } from './account-created-projection';
import { MoneyDepositedProjection } from './money-deposited-projection';
import { MoneyWithdrawnProjection } from './money-withdrawn-projection';
import { AccountRepository } from '../repositories/account-repository';

/**
 * Account Projection Registry
 *
 * Configures and manages all Account-specific projections
 * Extends base ProjectionRegistry with Account domain knowledge
 *
 * Registered Projections:
 * - AccountCreatedProjection: Replays aggregate, creates record in read DB
 * - MoneyDepositedProjection: Replays aggregate, updates read DB with latest state
 * - MoneyWithdrawnProjection: Replays aggregate, updates read DB with latest state
 *
 * Pattern: All projections replay aggregate from Event Store to get latest state,
 * then sync that state to read model. No calculation logic in projections.
 *
 * Usage:
 * ```typescript
 * const repository = new AccountRepository(eventStore);
 * const registry = new AccountProjectionRegistry(prisma, repository);
 * const repositoryWithProjections = new AccountRepository(eventStore, registry);
 * ```
 */
export class AccountProjectionRegistry extends ProjectionRegistry {
  constructor(prisma: PrismaClient, repository: AccountRepository) {
    super();

    // Create replayById function that wraps repository
    const replayById = repository.replayById.bind(repository);

    // Register all account projections with replay capability
    this.register(new AccountCreatedProjection(prisma, replayById));
    this.register(new MoneyDepositedProjection(prisma, replayById));
    this.register(new MoneyWithdrawnProjection(prisma, replayById));
  }
}
