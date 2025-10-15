import { User } from '../entities/user';
import { UserId } from '../value-objects/user-id';
import { Email } from '../value-objects/email';
import { UserName } from '../value-objects/user-name';
import { UserStatus } from '../value-objects/user-status';
import { DomainEvent } from '../../../../shared/domain/events/domain-event';
import { UserEventType } from '../events/user-event-type';
import { UserSnapshot } from '../snapshots/user-snapshot';
import { RehydratorStatic } from '../../../../shared/infrastructure/event-store/base-event-sourced-repository';

export class UserRehydrator {
  static rehydrate(events: DomainEvent[]): User {
    if (events.length === 0) {
      throw new Error('No events to replay');
    }

    const firstEvent = events[0];
    if (firstEvent.eventType !== UserEventType.USER_CREATED) {
      throw new Error('First event must be UserCreated');
    }

    const eventData = firstEvent.data as any;
    const user = User.reconstruct(
      UserId.create(eventData.userId),
      Email.create(eventData.email),
      UserName.create(eventData.name),
      UserStatus.create(eventData.status),
      new Date(eventData.createdAt)
    );

    for (let i = 1; i < events.length; i++) {
      this.replayEvent(user, events[i]);
    }

    return user;
  }

  static rehydrateFromSnapshot(
    snapshot: UserSnapshot,
    eventsAfterSnapshot: DomainEvent[]
  ): User {
    const user = User.reconstruct(
      UserId.create(snapshot.userId),
      Email.create(snapshot.email),
      UserName.create(snapshot.name),
      UserStatus.create(snapshot.status),
      new Date(snapshot.createdAt)
    );

    for (const event of eventsAfterSnapshot) {
      this.replayEvent(user, event);
    }

    return user;
  }

  static createSnapshot(user: User, version: number): UserSnapshot {
    return UserSnapshot.create(
      user.id.getValue(),
      user.email.getValue(),
      user.name.getValue(),
      user.status.getValue(),
      user.createdAt.toISOString(),
      version
    );
  }

  private static replayEvent(user: User, event: DomainEvent): void {
    const eventData = event.data as any;

    switch (event.eventType) {
      case UserEventType.USER_VERIFIED:
        const verifiedStatus = UserStatus.verified();
        user.applyStatusChange(verifiedStatus);
        break;

      default:
        throw new Error(`Unknown event type: ${event.eventType}`);
    }
  }
}

const _typeCheck: RehydratorStatic<User, UserSnapshot> = UserRehydrator;
