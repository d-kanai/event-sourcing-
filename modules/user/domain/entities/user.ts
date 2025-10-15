import { AggregateRoot } from '../../../../shared/domain/entities/aggregate-root';
import { UserId } from '../value-objects/user-id';
import { Email } from '../value-objects/email';
import { UserName } from '../value-objects/user-name';
import { UserStatus } from '../value-objects/user-status';
import { UserCreatedEvent, UserVerifiedEvent } from '../events/user-events';

export class User extends AggregateRoot {
  private readonly _id: UserId;
  private _email: Email;
  private _name: UserName;
  private _status: UserStatus;
  private readonly _createdAt: Date;

  private constructor(
    id: UserId,
    email: Email,
    name: UserName,
    status: UserStatus,
    createdAt: Date
  ) {
    super();
    this._id = id;
    this._email = email;
    this._name = name;
    this._status = status;
    this._createdAt = createdAt;
  }

  static register(email: string, name: string): User {
    const userId = UserId.generate();
    const user = new User(
      userId,
      Email.create(email),
      UserName.create(name),
      UserStatus.pendingVerification(),
      new Date()
    );

    user.addEvent(
      new UserCreatedEvent(userId.getValue(), {
        userId: userId.getValue(),
        email,
        name,
        status: 'PENDING_VERIFICATION',
        createdAt: new Date().toISOString(),
      })
    );

    return user;
  }

  static reconstruct(
    id: UserId,
    email: Email,
    name: UserName,
    status: UserStatus,
    createdAt: Date
  ): User {
    return new User(id, email, name, status, createdAt);
  }

  verify(): void {
    if (!this._status.isPending()) {
      throw new Error('User is not pending verification');
    }

    this._status = UserStatus.verified();

    this.addEvent(
      new UserVerifiedEvent(this._id.getValue(), {
        userId: this._id.getValue(),
        verifiedAt: new Date().toISOString(),
      })
    );
  }

  applyStatusChange(status: UserStatus): void {
    this._status = status;
  }

  get id(): UserId {
    return this._id;
  }

  get email(): Email {
    return this._email;
  }

  get name(): UserName {
    return this._name;
  }

  get status(): UserStatus {
    return this._status;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  toJSON() {
    return {
      id: this._id.getValue(),
      email: this._email.getValue(),
      name: this._name.getValue(),
      status: this._status.getValue(),
      createdAt: this._createdAt.toISOString(),
    };
  }
}
