import { AccountId } from '../../domain/value-objects/account-id';
import { PrismaAccountRepository } from '../../infrastructure/repositories/prisma-account-repository';

export interface GetAccountInput {
  id: string;
}

export interface GetAccountOutput {
  id: string;
  balance: number;
  status: string;
  createdAt: string;
}

/**
 * Query use case - reads from the projected read model (SQLite) for optimal performance.
 * Following CQRS pattern: queries go to read database, not event replay.
 */
export class GetAccountUseCase {
  constructor(private readonly readRepository: PrismaAccountRepository) {}

  async execute(input: GetAccountInput): Promise<GetAccountOutput | null> {
    const accountId = AccountId.create(input.id);
    const account = await this.readRepository.findById(accountId);

    if (!account) {
      return null;
    }

    return account.toJSON();
  }
}
