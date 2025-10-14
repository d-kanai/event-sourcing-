import { EventSourcedAccountRepository } from '../../infrastructure/event-store/event-sourced-account-repository';
import { PrismaAccountRepository } from '../../infrastructure/repositories/prisma-account-repository';
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
 * Command use case following CQRS pattern:
 * - Reads from Event Store (source of truth for commands)
 * - Writes to Event Store + projects to read model
 * - Returns final state from read model (projected view)
 */
export class WithdrawUseCase {
  constructor(
    private readonly writeRepository: EventSourcedAccountRepository,
    private readonly readRepository: PrismaAccountRepository
  ) {}

  async execute(input: WithdrawInput): Promise<WithdrawOutput> {
    const accountId = AccountId.create(input.accountId);

    // Read from Event Store to get current aggregate state
    const account = await this.writeRepository.findById(accountId);

    if (!account) {
      throw new Error(`Account not found: ${input.accountId}`);
    }

    // Execute domain logic
    account.withdraw(input.amount);

    // Save to Event Store (which triggers projection to read model)
    await this.writeRepository.save(account);

    // Return from read model for consistent query response
    const updatedAccount = await this.readRepository.findById(accountId);
    return updatedAccount!.toJSON();
  }
}
