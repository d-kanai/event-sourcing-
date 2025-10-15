import { PrismaClient } from '@prisma/client';
import { ProjectionRegistry } from '../../../../shared/infrastructure/projections';
import { UserProjection } from './user-projection';
import { UserRepository } from '../repositories/user-repository';

export class UserProjectionRegistry extends ProjectionRegistry {
  constructor(prisma: PrismaClient, repository: UserRepository) {
    super();

    const replayById = repository.replayById.bind(repository);
    const userProjection = new UserProjection(prisma, replayById);

    for (const eventType of userProjection.getSupportedEventTypes()) {
      this.registerForEventType(eventType, userProjection);
    }
  }

  private registerForEventType(eventType: string, projection: UserProjection): void {
    const originalEventType = projection.eventType.bind(projection);
    projection.eventType = () => eventType;
    this.register(projection);
    projection.eventType = originalEventType;
  }
}
