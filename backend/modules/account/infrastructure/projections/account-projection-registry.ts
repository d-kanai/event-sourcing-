import { PrismaClient } from '@prisma/client';
import { ProjectionRegistry } from '../../../shared/infrastructure/projections';
import { AccountProjection } from './account-projection';
import { AccountRepository } from '../repositories/account-repository';

export class AccountProjectionRegistry extends ProjectionRegistry {
  constructor(prisma: PrismaClient, repository: AccountRepository) {
    super();

    const replayById = repository.replayById.bind(repository);

    const accountProjection = new AccountProjection(prisma, replayById);

    for (const eventType of accountProjection.getSupportedEventTypes()) {
      this.registerForEventType(eventType, accountProjection);
    }
  }

  private registerForEventType(eventType: string, projection: AccountProjection): void {
    const originalEventType = projection.eventType.bind(projection);
    projection.eventType = () => eventType;
    this.register(projection);
    projection.eventType = originalEventType;
  }
}
