import { User } from '../../domain/entities/user';
import { UserId } from '../../domain/value-objects/user-id';
import { UserRehydrator } from '../../domain/rehydrators/user-rehydrator';
import { UserSnapshot } from '../../domain/snapshots/user-snapshot';
import {
  BaseEventSourcedRepository,
  EventStore,
  ProjectionRegistry,
  SnapshotRepository,
} from '../../../../shared/infrastructure/event-store/base-event-sourced-repository';
import { getFirestore } from '../../../../shared/infrastructure/event-store/firestore-client';

export class UserRepository extends BaseEventSourcedRepository<
  User,
  UserId,
  UserSnapshot
> {
  constructor(
    eventStore: EventStore,
    projectionRegistry?: ProjectionRegistry,
    snapshotRepository?: SnapshotRepository<UserSnapshot>
  ) {
    const rehydrator = UserRehydrator;
    super(eventStore, rehydrator, projectionRegistry, snapshotRepository);
  }

  async save(user: User): Promise<void> {
    const events = user.getUncommittedEvents();
    const firestore = getFirestore();

    await super.save(user);

    for (const event of events) {
      await firestore.collection('events').add({
        eventId: event.eventId,
        eventType: event.eventType,
        aggregateId: event.aggregateId,
        aggregateType: event.aggregateType,
        occurredAt: event.occurredAt,
        data: event.data,
        metadata: event.metadata || {},
        processed: false,
        createdAt: new Date(),
      });
    }
  }

  protected getStreamName(id: UserId): string {
    return `user-${id.getValue()}`;
  }

  protected extractIdValue(id: UserId): string {
    return id.getValue();
  }

  protected extractId(user: User): UserId {
    return user.id;
  }
}
