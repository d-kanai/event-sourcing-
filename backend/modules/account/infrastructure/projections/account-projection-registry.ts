import { PrismaClient } from '@prisma/client';
import { ProjectionRegistry } from '../../../shared/infrastructure/projections';
import { AccountCreatedProjection } from './account-created-projection';
import { MoneyDepositedProjection } from './money-deposited-projection';
import { MoneyWithdrawnProjection } from './money-withdrawn-projection';
import { AccountSuspendedProjection } from './account-suspended-projection';
import { AccountActivatedProjection } from './account-activated-projection';
import { AccountClosedProjection } from './account-closed-projection';

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
 * - AccountSuspendedProjection: Updates status to SUSPENDED
 * - AccountActivatedProjection: Updates status to ACTIVE
 * - AccountClosedProjection: Updates status to CLOSED
 *
 * Usage:
 * ```typescript
 * const registry = new AccountProjectionRegistry(prisma);
 * const writeRepo = new AccountWriteRepository(eventStore, registry);
 * ```
 */
export class AccountProjectionRegistry extends ProjectionRegistry {
  constructor(prisma: PrismaClient) {
    super();

    // Register all account projections
    this.register(new AccountCreatedProjection(prisma));
    this.register(new MoneyDepositedProjection(prisma));
    this.register(new MoneyWithdrawnProjection(prisma));
    this.register(new AccountSuspendedProjection(prisma));
    this.register(new AccountActivatedProjection(prisma));
    this.register(new AccountClosedProjection(prisma));
  }
}
