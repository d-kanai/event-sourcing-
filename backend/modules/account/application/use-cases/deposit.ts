import { AccountRepository } from '../../domain/repositories/account-repository';
import { AccountId } from '../../domain/value-objects/account-id';
import { PrismaAccountRepository } from '../../infrastructure/repositories/prisma-account-repository';

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

/**
 * Command use case following CQRS pattern:
 * - Reads from Event Store (source of truth for commands)
 * - Writes to Event Store + projects to read model
 * - Returns final state from read model (projected view)
 */
export class DepositUseCase {
  constructor(
    private readonly writeRepository: AccountRepository,
    private readonly readRepository: PrismaAccountRepository
  ) {}

  async execute(input: DepositInput): Promise<DepositOutput> {
    const accountId = AccountId.create(input.accountId);

    // Read from Event Store to get current aggregate state
    const account = await this.writeRepository.findById(accountId);

    if (!account) {
      throw new Error(`Account not found: ${input.accountId}`);
    }

    // Execute domain logic
    account.deposit(input.amount);

    // Save to Event Store (which triggers projection to read model)
    await this.writeRepository.save(account);

    // Return from read model for consistent query response
    const updatedAccount = await this.readRepository.findById(accountId);
    return updatedAccount!.toJSON();
  }
}
