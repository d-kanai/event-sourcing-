import { UserReadRepository } from '../../infrastructure/repositories/user-read-repository';

export interface GetUserOutput {
  id: string;
  email: string;
  name: string;
  status: string;
  createdAt: string;
}

export class GetUserQuery {
  constructor(private readonly readRepository: UserReadRepository) {}

  async execute(userId: string): Promise<GetUserOutput> {
    const user = await this.readRepository.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      status: user.status,
      createdAt: user.createdAt.toISOString(),
    };
  }
}
