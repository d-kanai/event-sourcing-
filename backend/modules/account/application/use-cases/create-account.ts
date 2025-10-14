import { Account } from '../../domain/entities/account';
import { EventSourcedAccountRepository } from '../../infrastructure/event-store/event-sourced-account-repository';
import { Balance } from '../../domain/value-objects/balance';
import { AccountStatus } from '../../domain/value-objects/account-status';

export interface CreateAccountInput {
  initialBalance?: number;
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
    const account = Account.create({
      balance: input.initialBalance
        ? Balance.create(input.initialBalance)
        : Balance.zero(),
      status: AccountStatus.active(),
    });

    await this.writeRepository.save(account);

    return account.toJSON();
  }
}
