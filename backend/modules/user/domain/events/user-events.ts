import { BaseDomainEvent } from '../../../../shared/domain/events/domain-event';
import { UserEventType } from './user-event-type';

export interface UserCreatedData {
  userId: string;
  email: string;
  name: string;
  status: string;
  createdAt: string;
}

export class UserCreatedEvent extends BaseDomainEvent {
  constructor(userId: string, data: UserCreatedData) {
    super(UserEventType.USER_CREATED, userId, data);
  }

  get userData(): UserCreatedData {
    return this.data as UserCreatedData;
  }
}

export interface UserVerifiedData {
  userId: string;
  verifiedAt: string;
}

export class UserVerifiedEvent extends BaseDomainEvent {
  constructor(userId: string, data: UserVerifiedData) {
    super(UserEventType.USER_VERIFIED, userId, data);
  }

  get verifiedData(): UserVerifiedData {
    return this.data as UserVerifiedData;
  }
}

export type UserEvent =
  | UserCreatedEvent
  | UserVerifiedEvent;
