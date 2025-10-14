import { AccountFactory } from '../../domain/factories/account-factory';
import { AccountWriteRepository } from '../../infrastructure/repositories/account-write-repository';

export interface CreateAccountInput {
  initialBalance: number;
}

export interface CreateAccountOutput {
  id: string;
  balance: number;
  status: string;
  createdAt: string;
}

/**
 * Command: Create a new account
 * Writes to Event Store and returns the created aggregate state
 */
export class CreateAccountCommand {
  constructor(
    private readonly writeRepository: AccountWriteRepository
  ) {}

  async execute(input: CreateAccountInput): Promise<CreateAccountOutput> {
    const account = AccountFactory.createNew(input.initialBalance);

    await this.writeRepository.save(account);

    return account.toJSON();
  }
}
