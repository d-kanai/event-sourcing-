import { Account } from '../../domain/entities/account';
import { AccountRepository } from '../../domain/repositories/account-repository';
import { Balance } from '../../domain/value-objects/balance';
import { AccountStatus } from '../../domain/value-objects/account-status';

export interface CreateAccountInput {
  initialBalance?: number;
}

export interface CreateAccountOutput {
  id: string;
  balance: number;
  status: string;
  createdAt: string;
}

export class CreateAccountUseCase {
  constructor(private readonly accountRepository: AccountRepository) {}

  async execute(input: CreateAccountInput): Promise<CreateAccountOutput> {
    const account = Account.create({
      balance: input.initialBalance
        ? Balance.create(input.initialBalance)
        : Balance.zero(),
      status: AccountStatus.active(),
    });

    await this.accountRepository.save(account);

    return account.toJSON();
  }
}
