import { AccountRepository } from '../../infrastructure/repositories/account-repository';
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

/**
 * Command: Withdraw money from account
 * - Reads from Event Store (source of truth for commands)
 * - Writes to Event Store + projects to read model
 * - Returns aggregate state directly (source of truth)
 */
export class WithdrawCommand {
  constructor(
    private readonly repository: AccountRepository
  ) {}

  async execute(input: WithdrawInput): Promise<WithdrawOutput> {
    const accountId = AccountId.create(input.accountId);

    // Read from Event Store to get current aggregate state
    const account = await this.repository.replayById(accountId);

    if (!account) {
      throw new Error(`Account not found: ${input.accountId}`);
    }

    // Execute domain logic
    account.withdraw(input.amount);

    // Save to Event Store (which triggers projection to read model)
    await this.repository.save(account);

    // Return aggregate state directly (source of truth after command execution)
    return account.toJSON();
  }
}
