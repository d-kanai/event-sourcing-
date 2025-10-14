import { PrismaClient } from '../../infrastructure/prisma/generated/test-client';
import {
  setupTestDatabase,
  teardownTestDatabase,
  cleanupTestDatabase,
} from '../../infrastructure/prisma/test-helper';
import { PrismaAccountRepository } from '../../infrastructure/repositories/prisma-account-repository';
import { GetAccountUseCase } from './get-account';
import { CreateAccountUseCase } from './create-account';

describe('GetAccountUseCase', () => {
  let prisma: PrismaClient;
  let repository: PrismaAccountRepository;
  let useCase: GetAccountUseCase;
  let createAccountUseCase: CreateAccountUseCase;

  beforeAll(async () => {
    prisma = await setupTestDatabase();
    repository = new PrismaAccountRepository(prisma as any);
    useCase = new GetAccountUseCase(repository);
    createAccountUseCase = new CreateAccountUseCase(repository);
  });

  afterAll(async () => {
    await teardownTestDatabase(prisma);
  });

  afterEach(async () => {
    await cleanupTestDatabase(prisma);
  });

  describe('execute', () => {
    it('IDで既存のアカウントを取得できる', async () => {
      const created = await createAccountUseCase.execute({ initialBalance: 500 });

      const result = await useCase.execute({ id: created.id });

      expect(result).toMatchObject({
        id: created.id,
        balance: 500,
        status: 'ACTIVE',
        createdAt: expect.any(String),
      });
    });

    it('存在しないアカウントの場合nullを返す', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';
      const result = await useCase.execute({ id: fakeId });

      expect(result).toBeNull();
    });

    it('無効なUUID形式の場合エラーを投げる', async () => {
      await expect(useCase.execute({ id: 'invalid-id' })).rejects.toThrow(
        'Invalid account ID'
      );
    });

    it('作成後のアカウントを正しい残高で取得できる', async () => {
      const initialBalance = 12345.6789;
      const created = await createAccountUseCase.execute({ initialBalance });

      const result = await useCase.execute({ id: created.id });

      expect(result).not.toBeNull();
      expect(result!.balance).toBe(initialBalance);
    });

    it('複数の異なるアカウントを正しく取得できる', async () => {
      const account1 = await createAccountUseCase.execute({ initialBalance: 100 });
      const account2 = await createAccountUseCase.execute({ initialBalance: 200 });

      const result1 = await useCase.execute({ id: account1.id });
      const result2 = await useCase.execute({ id: account2.id });

      expect(result1!.balance).toBe(100);
      expect(result2!.balance).toBe(200);
      expect(result1!.id).not.toBe(result2!.id);
    });
  });
});
