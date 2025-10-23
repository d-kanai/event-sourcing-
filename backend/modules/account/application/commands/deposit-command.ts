import { AccountRepository } from '../../infrastructure/repositories/account-repository';
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

export class DepositCommand {
  constructor(
    private readonly repository: AccountRepository
  ) {}

  async execute(input: DepositInput): Promise<DepositOutput> {
    const accountId = AccountId.create(input.accountId);

    const account = await this.repository.replayById(accountId);

    if (!account) {
      throw new Error(`Account not found: ${input.accountId}`);
    }

    account.deposit(input.amount);

    await this.repository.save(account);

    return account.toJSON();
  }
}
