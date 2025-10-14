import { AccountRepository } from '../../domain/repositories/account-repository';
import { AccountId } from '../../domain/value-objects/account-id';

export interface WithdrawInput {
  accountId: string;
  amount: number;
}

export interface WithdrawOutput {
  id: string;
  balance: number;
  status: string;
  createdAt: string;
}

export class WithdrawUseCase {
  constructor(private readonly accountRepository: AccountRepository) {}

  async execute(input: WithdrawInput): Promise<WithdrawOutput> {
    const accountId = AccountId.create(input.accountId);
    const account = await this.accountRepository.findById(accountId);

    if (!account) {
      throw new Error(`Account not found: ${input.accountId}`);
    }

    account.withdraw(input.amount);
    await this.accountRepository.save(account);

    return account.toJSON();
  }
}
