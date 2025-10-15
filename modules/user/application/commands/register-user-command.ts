import { User } from '../../domain/entities/user';
import { UserRepository } from '../../infrastructure/repositories/user-repository';

export interface RegisterUserInput {
  email: string;
  name: string;
}

export class RegisterUserCommand {
  constructor(private readonly repository: UserRepository) {}

  async execute(input: RegisterUserInput) {
    const user = User.register(input.email, input.name);
    await this.repository.save(user);
    return user.toJSON();
  }
}
