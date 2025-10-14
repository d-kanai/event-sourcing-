import { AccountRepository } from '../../domain/repositories/account-repository';
import { AccountId } from '../../domain/value-objects/account-id';

export interface DepositInput {
  accountId: string;
  amount: number;
}

export interface DepositOutput {
  id: string;
  balance: number;
  status: string;
  createdAt: string;
}

export class DepositUseCase {
  constructor(private readonly accountRepository: AccountRepository) {}

  async execute(input: DepositInput): Promise<DepositOutput> {
    const accountId = AccountId.create(input.accountId);
    const account = await this.accountRepository.findById(accountId);

    if (!account) {
      throw new Error(`Account not found: ${input.accountId}`);
    }

    account.deposit(input.amount);
    await this.accountRepository.save(account);

    return account.toJSON();
  }
}
