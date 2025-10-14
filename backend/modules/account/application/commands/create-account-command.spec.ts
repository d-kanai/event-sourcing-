import { PrismaClient } from '../../infrastructure/prisma/generated/test-client';
import {
  setupTestDatabase,
  teardownTestDatabase,
  cleanupTestDatabase,
} from '../../infrastructure/prisma/test-helper';
import { CreateAccountCommand } from './create-account-command';
import { InMemoryEventStore } from '../../../shared/infrastructure/event-store/in-memory-event-store';
import { AccountRepository } from '../../infrastructure/repositories/account-repository';
import { AccountProjectionRegistry } from '../../infrastructure/projections/account-projection-registry';

describe('CreateAccountCommand', () => {
  let prisma: PrismaClient;
  let eventStore: InMemoryEventStore;
  let repository: AccountRepository;
  let useCase: CreateAccountCommand;

  beforeAll(async () => {
    prisma = await setupTestDatabase();
  });

  beforeEach(() => {
    eventStore = new InMemoryEventStore();
    const projectionRegistry = new AccountProjectionRegistry(prisma as any);
    repository = new AccountRepository(eventStore, projectionRegistry);
    useCase = new CreateAccountCommand(repository);
  });

  afterAll(async () => {
    await teardownTestDatabase(prisma);
  });

  afterEach(async () => {
    eventStore.clear();
    await cleanupTestDatabase(prisma);
  });

  describe('execute', () => {
    it('残高ゼロのアカウントを作成できる', async () => {
      const result = await useCase.execute({ initialBalance: 0 });

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
