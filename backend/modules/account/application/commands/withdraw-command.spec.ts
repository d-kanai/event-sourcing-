import { PrismaClient } from '../../infrastructure/prisma/generated/test-client';
import {
  setupTestDatabase,
  teardownTestDatabase,
  cleanupTestDatabase,
} from '../../infrastructure/prisma/test-helper';
import { WithdrawCommand } from './withdraw-command';
import { CreateAccountCommand } from './create-account-command';
import { DepositCommand } from './deposit-command';
import { InMemoryEventStore } from '../../../shared/infrastructure/event-store/in-memory-event-store';
import { AccountWriteRepository } from '../../infrastructure/repositories/account-write-repository';
import { AccountReadRepository } from '../../infrastructure/repositories/account-read-repository';
import { AccountProjectionRegistry } from '../../infrastructure/projections/account-projection-registry';

describe('WithdrawCommand', () => {
  let prisma: PrismaClient;
  let eventStore: InMemoryEventStore;
  let writeRepository: AccountWriteRepository;
  let readRepository: AccountReadRepository;
  let useCase: WithdrawCommand;
  let createAccountCommand: CreateAccountCommand;
  let depositCommand: DepositCommand;

  beforeAll(async () => {
    prisma = await setupTestDatabase();
  });

  beforeEach(() => {
    eventStore = new InMemoryEventStore();
    const projectionRegistry = new AccountProjectionRegistry(prisma as any);
    writeRepository = new AccountWriteRepository(eventStore, projectionRegistry);
    readRepository = new AccountReadRepository(prisma as any);
    // WithdrawCommand now returns aggregate state directly
    useCase = new WithdrawCommand(writeRepository);
    createAccountCommand = new CreateAccountCommand(writeRepository);
    depositCommand = new DepositCommand(writeRepository);
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
      const account = await createAccountCommand.execute({ initialBalance: 1000 });

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
      const account = await createAccountCommand.execute({ initialBalance: 500 });

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
      const account = await createAccountCommand.execute({ initialBalance: 1000 });

      await expect(
        useCase.execute({ accountId: account.id, amount: 1001 })
      ).rejects.toThrow('Insufficient balance');

      const dbAccount = await prisma.account.findUnique({
        where: { id: account.id },
      });
      expect(dbAccount!.balance).toBe(1000);
    });

    it('残高ゼロのアカウントからの出金は拒否される', async () => {
      const account = await createAccountCommand.execute({ initialBalance: 0 });

      await expect(
        useCase.execute({ accountId: account.id, amount: 1 })
      ).rejects.toThrow('Insufficient balance');

      const dbAccount = await prisma.account.findUnique({
        where: { id: account.id },
      });
      expect(dbAccount!.balance).toBe(0);
    });

    it('負の出金額は拒否される', async () => {
      const account = await createAccountCommand.execute({ initialBalance: 1000 });

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
      const account = await createAccountCommand.execute({ initialBalance: 1000 });

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
      const account = await createAccountCommand.execute({ initialBalance: 500 });

      await depositCommand.execute({ accountId: account.id, amount: 300 });
      await useCase.execute({ accountId: account.id, amount: 200 });
      await depositCommand.execute({ accountId: account.id, amount: 100 });
      const result = await useCase.execute({ accountId: account.id, amount: 400 });

      expect(result.balance).toBe(300);

      const dbAccount = await prisma.account.findUnique({
        where: { id: account.id },
      });
      expect(dbAccount!.balance).toBe(300);
    });
  });
});
