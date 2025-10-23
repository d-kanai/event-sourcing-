import { AccountId } from '../../domain/value-objects/account-id';
import { AccountReadRepository } from '../../infrastructure/repositories/account-read-repository';

export interface GetAccountInput {
  id: string;
}

export interface GetAccountOutput {
  id: string;
  balance: number;
  status: string;
  createdAt: string;
}

export class GetAccountQuery {
  constructor(private readonly readRepository: AccountReadRepository) {}

  async execute(input: GetAccountInput): Promise<GetAccountOutput | null> {
    const accountId = AccountId.create(input.id);
    const account = await this.readRepository.findById(accountId);

    if (!account) {
      return null;
    }

    return account.toJSON();
  }
}
