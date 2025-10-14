import { Account } from '../entities/account';
import { AccountId } from '../value-objects/account-id';

export interface AccountRepository {
  save(account: Account): Promise<void>;
  findById(id: AccountId): Promise<Account | null>;
}
