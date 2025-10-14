import { PrismaClient } from '@prisma/client';
import { ProjectionRegistry } from '../../../shared/infrastructure/projections';
import { AccountCreatedProjection } from './account-created-projection';
import { MoneyDepositedProjection } from './money-deposited-projection';
import { MoneyWithdrawnProjection } from './money-withdrawn-projection';

/**
 * Account Projection Registry
 *
 * Configures and manages all Account-specific projections
 * Extends base ProjectionRegistry with Account domain knowledge
 *
 * Registered Projections:
 * - AccountCreatedProjection: Creates account record in read DB
 * - MoneyDepositedProjection: Updates balance (adds amount)
 * - MoneyWithdrawnProjection: Updates balance (subtracts amount)
 *
 * Usage:
 * ```typescript
 * const registry = new AccountProjectionRegistry(prisma);
 * const writeRepo = new AccountRepository(eventStore, registry);
 * ```
 */
export class AccountProjectionRegistry extends ProjectionRegistry {
  constructor(prisma: PrismaClient) {
    super();

    // Register all account projections
    this.register(new AccountCreatedProjection(prisma));
    this.register(new MoneyDepositedProjection(prisma));
    this.register(new MoneyWithdrawnProjection(prisma));
  }
}
