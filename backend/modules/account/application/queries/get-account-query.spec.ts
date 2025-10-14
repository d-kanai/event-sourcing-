import { PrismaClient } from '../../infrastructure/prisma/generated/test-client';
import {
  setupTestDatabase,
  teardownTestDatabase,
  cleanupTestDatabase,
} from '../../infrastructure/prisma/test-helper';
import { GetAccountQuery } from './get-account-query';
import { CreateAccountCommand } from '../commands/create-account-command';
import { InMemoryEventStore } from '../../../shared/infrastructure/event-store/in-memory-event-store';
import { AccountRepository } from '../../infrastructure/repositories/account-repository';
import { AccountReadRepository } from '../../infrastructure/repositories/account-read-repository';
import { AccountProjectionRegistry } from '../../infrastructure/projections/account-projection-registry';

describe('GetAccountQuery', () => {
  let prisma: PrismaClient;
  let eventStore: InMemoryEventStore;
  let repository: AccountRepository;
  let readRepository: AccountReadRepository;
  let useCase: GetAccountQuery;
  let createAccountCommand: CreateAccountCommand;

  beforeAll(async () => {
    prisma = await setupTestDatabase();
  });

  beforeEach(() => {
    eventStore = new InMemoryEventStore();
    const repositoryForProjections = new AccountRepository(eventStore);
    const projectionRegistry = new AccountProjectionRegistry(prisma as any, repositoryForProjections);
    repository = new AccountRepository(eventStore, projectionRegistry);
    readRepository = new AccountReadRepository(prisma as any);
    // GetAccountQuery uses read repository (Query side of CQRS)
    useCase = new GetAccountQuery(readRepository);
    // CreateAccountCommand uses write repository (Command side of CQRS)
    createAccountCommand = new CreateAccountCommand(repository);
  });

  afterAll(async () => {
    await teardownTestDatabase(prisma);
  });

  afterEach(async () => {
    eventStore.clear();
    await cleanupTestDatabase(prisma);
  });

  describe('execute', () => {
    it('IDで既存のアカウントを取得できる', async () => {
      const created = await createAccountCommand.execute({ initialBalance: 500 });

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
      const created = await createAccountCommand.execute({ initialBalance });

      const result = await useCase.execute({ id: created.id });

      expect(result).not.toBeNull();
      expect(result!.balance).toBe(initialBalance);
    });

    it('複数の異なるアカウントを正しく取得できる', async () => {
      const account1 = await createAccountCommand.execute({ initialBalance: 100 });
      const account2 = await createAccountCommand.execute({ initialBalance: 200 });

      const result1 = await useCase.execute({ id: account1.id });
      const result2 = await useCase.execute({ id: account2.id });

      expect(result1!.balance).toBe(100);
      expect(result2!.balance).toBe(200);
      expect(result1!.id).not.toBe(result2!.id);
    });
  });
});
