import { PrismaClient } from '@prisma/user-client';
import { DomainEvent } from '../../../../shared/domain/events/domain-event';
import { UserEventType } from '../../domain/events/user-event-type';
import { AggregateProjection } from '../../../../shared/infrastructure/projections';
import { User } from '../../domain/entities/user';
import { UserId } from '../../domain/value-objects/user-id';

export class UserProjection extends AggregateProjection<
  User,
  UserId,
  PrismaClient
> {
  private readonly supportedEventTypes = [
    UserEventType.USER_CREATED,
    UserEventType.USER_VERIFIED,
  ];

  eventType(): string {
    return this.supportedEventTypes[0];
  }

  getSupportedEventTypes(): string[] {
    return this.supportedEventTypes;
  }

  protected extractAggregateId(event: DomainEvent): UserId {
    const data = event.data as any;
    return UserId.create(data.userId);
  }

  protected async updateReadModel(user: User): Promise<void> {
    await this.prisma.user.upsert({
      where: { id: user.id.getValue() },
      create: {
        id: user.id.getValue(),
        email: user.email.getValue(),
        name: user.name.getValue(),
        status: user.status.getValue(),
        createdAt: user.createdAt,
      },
      update: {
        status: user.status.getValue(),
      },
    });
  }
}
