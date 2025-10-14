import { PrismaClient } from '../../infrastructure/prisma/generated/test-client';
import {
  setupTestDatabase,
  teardownTestDatabase,
  cleanupTestDatabase,
} from '../../infrastructure/prisma/test-helper';
import { WithdrawUseCase } from './withdraw';
import { CreateAccountUseCase } from './create-account';
import { DepositUseCase } from './deposit';
import { InMemoryEventStore } from '../../infrastructure/event-store/in-memory-event-store';
import { EventSourcedAccountRepository } from '../../infrastructure/event-store/event-sourced-account-repository';
import { AccountProjection } from '../../infrastructure/projections/account-projection';

describe('WithdrawUseCase', () => {
  let prisma: PrismaClient;
  let eventStore: InMemoryEventStore;
  let repository: EventSourcedAccountRepository;
  let useCase: WithdrawUseCase;
  let createAccountUseCase: CreateAccountUseCase;
  let depositUseCase: DepositUseCase;

  beforeAll(async () => {
    prisma = await setupTestDatabase();
  });

  beforeEach(() => {
    eventStore = new InMemoryEventStore();
    const projection = new AccountProjection(prisma as any);
    repository = new EventSourcedAccountRepository(eventStore, projection);
    useCase = new WithdrawUseCase(repository);
    createAccountUseCase = new CreateAccountUseCase(repository);
    depositUseCase = new DepositUseCase(repository);
  });

  afterAll(async () => {
    await teardownTestDatabase(prisma);
  });

  afterEach(async () => {
    eventStore.clear();
    await cleanupTestDatabase(prisma);
  });

  describe('execute', () => {
    it('アカウントから金額を出金できる', async () => {
      const account = await createAccountUseCase.execute({ initialBalance: 1000 });

      const result = await useCase.execute({
        accountId: account.id,
        amount: 300,
      });

      expect(result.balance).toBe(700);
      expect(result.id).toBe(account.id);
      expect(result.status).toBe('ACTIVE');

      const dbAccount = await prisma.account.findUnique({
        where: { id: account.id },
      });
      expect(dbAccount!.balance).toBe(700);
    });

    it('残高全額を出金できる', async () => {
      const account = await createAccountUseCase.execute({ initialBalance: 500 });

      const result = await useCase.execute({
        accountId: account.id,
        amount: 500,
      });

      expect(result.balance).toBe(0);

      const dbAccount = await prisma.account.findUnique({
        where: { id: account.id },
      });
      expect(dbAccount!.balance).toBe(0);
    });

    it('残高を超える出金は拒否される', async () => {
      const account = await createAccountUseCase.execute({ initialBalance: 1000 });

      await expect(
        useCase.execute({ accountId: account.id, amount: 1001 })
      ).rejects.toThrow('Insufficient balance');

      const dbAccount = await prisma.account.findUnique({
        where: { id: account.id },
      });
      expect(dbAccount!.balance).toBe(1000);
    });

    it('残高ゼロのアカウントからの出金は拒否される', async () => {
      const account = await createAccountUseCase.execute({});

      await expect(
        useCase.execute({ accountId: account.id, amount: 1 })
      ).rejects.toThrow('Insufficient balance');

      const dbAccount = await prisma.account.findUnique({
        where: { id: account.id },
      });
      expect(dbAccount!.balance).toBe(0);
    });

    it('負の出金額は拒否される', async () => {
      const account = await createAccountUseCase.execute({ initialBalance: 1000 });

      await expect(
        useCase.execute({ accountId: account.id, amount: -100 })
      ).rejects.toThrow('Amount to subtract must be non-negative');

      const dbAccount = await prisma.account.findUnique({
        where: { id: account.id },
      });
      expect(dbAccount!.balance).toBe(1000);
    });

    it('存在しないアカウントの場合エラーを投げる', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';

      await expect(
        useCase.execute({ accountId: fakeId, amount: 100 })
      ).rejects.toThrow('Account not found');
    });

    it('複数回の出金を正しく処理できる', async () => {
      const account = await createAccountUseCase.execute({ initialBalance: 1000 });

      await useCase.execute({ accountId: account.id, amount: 100 });
      await useCase.execute({ accountId: account.id, amount: 200 });
      const result = await useCase.execute({ accountId: account.id, amount: 150 });

      expect(result.balance).toBe(550);

      const dbAccount = await prisma.account.findUnique({
        where: { id: account.id },
      });
      expect(dbAccount!.balance).toBe(550);
    });

    it('入金と出金を組み合わせて処理できる', async () => {
      const account = await createAccountUseCase.execute({ initialBalance: 500 });

      await depositUseCase.execute({ accountId: account.id, amount: 300 });
      await useCase.execute({ accountId: account.id, amount: 200 });
      await depositUseCase.execute({ accountId: account.id, amount: 100 });
      const result = await useCase.execute({ accountId: account.id, amount: 400 });

      expect(result.balance).toBe(300);

      const dbAccount = await prisma.account.findUnique({
        where: { id: account.id },
      });
      expect(dbAccount!.balance).toBe(300);
    });
  });
});
