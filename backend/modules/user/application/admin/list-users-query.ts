import { UserReadRepository } from '../../infrastructure/repositories/user-read-repository';

export interface ListUsersOutput {
  users: Array<{
    id: string;
    email: string;
    name: string;
    status: string;
    createdAt: string;
  }>;
}

export class ListUsersQuery {
  constructor(private readonly readRepository: UserReadRepository) {}

  async execute(): Promise<ListUsersOutput> {
    const users = await this.readRepository.findAll();

    return {
      users: users.map((user) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        status: user.status,
        createdAt: user.createdAt.toISOString(),
      })),
    };
  }
}
