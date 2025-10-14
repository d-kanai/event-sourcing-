import { PrismaClient } from '@prisma/client';
import { ProjectionRegistry } from './projection-registry';
import { AccountCreatedProjection } from './account-created-projection';
import { MoneyDepositedProjection } from './money-deposited-projection';
import { MoneyWithdrawnProjection } from './money-withdrawn-projection';
import { AccountSuspendedProjection } from './account-suspended-projection';
import { AccountActivatedProjection } from './account-activated-projection';
import { AccountClosedProjection } from './account-closed-projection';

/**
 * Factory function to create a fully configured ProjectionRegistry
 * Used for both production and test environments
 */
export function createProjectionRegistry(
  prisma: PrismaClient
): ProjectionRegistry {
  const registry = new ProjectionRegistry();

  // Register all account projections
  registry.register(new AccountCreatedProjection(prisma));
  registry.register(new MoneyDepositedProjection(prisma));
  registry.register(new MoneyWithdrawnProjection(prisma));
  registry.register(new AccountSuspendedProjection(prisma));
  registry.register(new AccountActivatedProjection(prisma));
  registry.register(new AccountClosedProjection(prisma));

  return registry;
}
