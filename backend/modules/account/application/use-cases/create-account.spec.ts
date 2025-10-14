import { PrismaClient } from '../../infrastructure/prisma/generated/test-client';
import {
  setupTestDatabase,
  teardownTestDatabase,
  cleanupTestDatabase,
} from '../../infrastructure/prisma/test-helper';
import { CreateAccountUseCase } from './create-account';
import { InMemoryEventStore } from '../../infrastructure/event-store/in-memory-event-store';
import { EventSourcedAccountRepository } from '../../infrastructure/event-store/event-sourced-account-repository';
import { createTestProjectionRegistry } from '../../infrastructure/projections/test-projection-registry';

describe('CreateAccountUseCase', () => {
  let prisma: PrismaClient;
  let eventStore: InMemoryEventStore;
  let repository: EventSourcedAccountRepository;
  let useCase: CreateAccountUseCase;

  beforeAll(async () => {
    prisma = await setupTestDatabase();
  });

  beforeEach(() => {
    eventStore = new InMemoryEventStore();
    const projectionRegistry = createTestProjectionRegistry(prisma as any);
    repository = new EventSourcedAccountRepository(eventStore, projectionRegistry);
    useCase = new CreateAccountUseCase(repository);
  });

  afterAll(async () => {
    await teardownTestDatabase(prisma);
  });

  afterEach(async () => {
    eventStore.clear();
    await cleanupTestDatabase(prisma);
  });

  describe('execute', () => {
    it('初期残高を指定しない場合、残高ゼロのアカウントを作成できる', async () => {
      const result = await useCase.execute({});

      expect(result).toMatchObject({
        id: expect.any(String),
        balance: 0,
        status: 'ACTIVE',
        createdAt: expect.any(String),
      });

      const dbAccount = await prisma.account.findUnique({
        where: { id: result.id },
      });

      expect(dbAccount).toBeDefined();
      expect(dbAccount!.balance).toBe(0);
      expect(dbAccount!.status).toBe('ACTIVE');
    });

    it('指定した初期残高でアカウントを作成できる', async () => {
      const initialBalance = 1000;
      const result = await useCase.execute({ initialBalance });

      expect(result).toMatchObject({
        id: expect.any(String),
        balance: initialBalance,
        status: 'ACTIVE',
        createdAt: expect.any(String),
      });

      const dbAccount = await prisma.account.findUnique({
        where: { id: result.id },
      });

      expect(dbAccount).toBeDefined();
      expect(dbAccount!.balance).toBe(initialBalance);
    });

    it('負の初期残高は拒否される', async () => {
      await expect(useCase.execute({ initialBalance: -100 })).rejects.toThrow(
        'Invalid balance'
      );

      const accounts = await prisma.account.findMany();
      expect(accounts).toHaveLength(0);
    });

    it('複数のアカウントを一意のIDで作成できる', async () => {
      const result1 = await useCase.execute({ initialBalance: 100 });
      const result2 = await useCase.execute({ initialBalance: 200 });

      expect(result1.id).not.toBe(result2.id);

      const accounts = await prisma.account.findMany();
      expect(accounts).toHaveLength(2);
    });
  });
});
