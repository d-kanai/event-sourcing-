import { Account } from '../../domain/entities/account';
import { EventSourcedAccountRepository } from '../../infrastructure/event-store/event-sourced-account-repository';
import { Balance } from '../../domain/value-objects/balance';

export interface CreateAccountInput {
  initialBalance: number;
}

export interface CreateAccountOutput {
  id: string;
  balance: number;
  status: string;
  createdAt: string;
}

export class CreateAccountUseCase {
  constructor(
    private readonly writeRepository: EventSourcedAccountRepository
  ) {}

  async execute(input: CreateAccountInput): Promise<CreateAccountOutput> {
    const initialBalance = Balance.create(input.initialBalance);
    const account = Account.create(initialBalance);

    await this.writeRepository.save(account);

    return account.toJSON();
  }
}
