import { AccountFactory } from '../../domain/factories/account-factory';
import { AccountRepository } from '../../infrastructure/repositories/account-repository';

export interface CreateAccountInput {
  userId: string;
  initialBalance: number;
}

export interface CreateAccountOutput {
  id: string;
  userId: string;
  balance: number;
  status: string;
  createdAt: string;
}

export class CreateAccountCommand {
  constructor(
    private readonly repository: AccountRepository
  ) {}

  async execute(input: CreateAccountInput): Promise<CreateAccountOutput> {
    const account = AccountFactory.createNew(input.userId, input.initialBalance);

    await this.repository.save(account);

    return account.toJSON();
  }
}
