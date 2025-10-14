import { PrismaClient } from '../../infrastructure/prisma/generated/test-client';
import {
  setupTestDatabase,
  teardownTestDatabase,
  cleanupTestDatabase,
} from '../../infrastructure/prisma/test-helper';
import { PrismaAccountRepository } from '../../infrastructure/repositories/prisma-account-repository';
import { DepositUseCase } from './deposit';
import { CreateAccountUseCase } from './create-account';
import { GetAccountUseCase } from './get-account';

describe('DepositUseCase', () => {
  let prisma: PrismaClient;
  let repository: PrismaAccountRepository;
  let useCase: DepositUseCase;
  let createAccountUseCase: CreateAccountUseCase;
  let getAccountUseCase: GetAccountUseCase;

  beforeAll(async () => {
    prisma = await setupTestDatabase();
    repository = new PrismaAccountRepository(prisma as any);
    useCase = new DepositUseCase(repository);
    createAccountUseCase = new CreateAccountUseCase(repository);
    getAccountUseCase = new GetAccountUseCase(repository);
  });

  afterAll(async () => {
    await teardownTestDatabase(prisma);
  });

  afterEach(async () => {
    await cleanupTestDatabase(prisma);
  });

  describe('execute', () => {
    it('アカウントに金額を入金できる', async () => {
      const account = await createAccountUseCase.execute({ initialBalance: 1000 });

      const result = await useCase.execute({
        accountId: account.id,
        amount: 500,
      });

      expect(result.balance).toBe(1500);
      expect(result.id).toBe(account.id);
      expect(result.status).toBe('ACTIVE');

      const dbAccount = await prisma.account.findUnique({
        where: { id: account.id },
      });
      expect(dbAccount!.balance).toBe(1500);
    });

    it('残高ゼロのアカウントに入金できる', async () => {
      const account = await createAccountUseCase.execute({});

      const result = await useCase.execute({
        accountId: account.id,
        amount: 250,
      });

      expect(result.balance).toBe(250);

      const dbAccount = await prisma.account.findUnique({
        where: { id: account.id },
      });
      expect(dbAccount!.balance).toBe(250);
    });

    it('複数回の入金を正しく処理できる', async () => {
      const account = await createAccountUseCase.execute({ initialBalance: 100 });

      await useCase.execute({ accountId: account.id, amount: 50 });
      await useCase.execute({ accountId: account.id, amount: 75 });
      const result = await useCase.execute({ accountId: account.id, amount: 25 });

      expect(result.balance).toBe(250);

      const dbAccount = await prisma.account.findUnique({
        where: { id: account.id },
      });
      expect(dbAccount!.balance).toBe(250);
    });

    it('負の入金額は拒否される', async () => {
      const account = await createAccountUseCase.execute({ initialBalance: 1000 });

      await expect(
        useCase.execute({ accountId: account.id, amount: -100 })
      ).rejects.toThrow('Amount to add must be non-negative');

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

    it('大きな金額の入金を処理できる', async () => {
      const account = await createAccountUseCase.execute({ initialBalance: 0 });

      const result = await useCase.execute({
        accountId: account.id,
        amount: 999999.99,
      });

      expect(result.balance).toBe(999999.99);

      const dbAccount = await prisma.account.findUnique({
        where: { id: account.id },
      });
      expect(dbAccount!.balance).toBeCloseTo(999999.99, 2);
    });
  });
});
