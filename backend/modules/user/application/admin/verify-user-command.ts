import { UserId } from '../../domain/value-objects/user-id';
import { UserRepository } from '../../infrastructure/repositories/user-repository';

export interface VerifyUserInput {
  userId: string;
}

export class VerifyUserCommand {
  constructor(private readonly repository: UserRepository) {}

  async execute(input: VerifyUserInput) {
    const userId = UserId.create(input.userId);
    const user = await this.repository.replayById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    user.verify();
    await this.repository.save(user);

    return user.toJSON();
  }
}
