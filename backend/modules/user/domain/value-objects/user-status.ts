import { ValueObject } from '../../../../shared/domain/value-objects';

export type UserStatusValue = 'PENDING_VERIFICATION' | 'VERIFIED';

export class UserStatus extends ValueObject<UserStatusValue> {
  private constructor(value: UserStatusValue) {
    super(value);
  }

  static create(value: string): UserStatus {
    if (value !== 'PENDING_VERIFICATION' && value !== 'VERIFIED') {
      throw new Error(`Invalid user status: ${value}`);
    }
    return new UserStatus(value);
  }

  static pendingVerification(): UserStatus {
    return new UserStatus('PENDING_VERIFICATION');
  }

  static verified(): UserStatus {
    return new UserStatus('VERIFIED');
  }

  getValue(): UserStatusValue {
    return this.value;
  }

  isPending(): boolean {
    return this.value === 'PENDING_VERIFICATION';
  }

  isVerified(): boolean {
    return this.value === 'VERIFIED';
  }
}
