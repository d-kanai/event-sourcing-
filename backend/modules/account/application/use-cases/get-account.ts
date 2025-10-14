import { AccountRepository } from '../../domain/repositories/account-repository';
import { AccountId } from '../../domain/value-objects/account-id';

export interface GetAccountInput {
  id: string;
}

export interface GetAccountOutput {
  id: string;
  balance: number;
  status: string;
  createdAt: string;
}

export class GetAccountUseCase {
  constructor(private readonly accountRepository: AccountRepository) {}

  async execute(input: GetAccountInput): Promise<GetAccountOutput | null> {
    const accountId = AccountId.create(input.id);
    const account = await this.accountRepository.findById(accountId);

    if (!account) {
      return null;
    }

    return account.toJSON();
  }
}
