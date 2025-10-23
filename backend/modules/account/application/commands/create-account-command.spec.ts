import { PrismaClient } from '../../infrastructure/prisma/generated/test-client';
import {
  setupTestDatabase,
  teardownTestDatabase,
  cleanupTestDatabase,
} from '../../infrastructure/prisma/test-helper';
import { CreateAccountCommand } from './create-account-command';
import { AccountRepository } from '../../infrastructure/repositories/account-repository';
import { AccountProjectionRegistry } from '../../infrastructure/projections/account-projection-registry';
import { AccountId } from '../../domain/value-objects/account-id';
import { Firestore } from '@google-cloud/firestore';
import {
  setupFirestoreTest,
  cleanupFirestoreTest,
  teardownFirestoreTest,
} from '../../../../shared/infrastructure/event-store/firestore-test-helper';
import {
  FirestoreEventStore,
  FirestoreEventStoreAdapter,
} from '../../../../shared/infrastructure/event-store';

describe('CreateAccountCommand', () => {
  let prisma: PrismaClient;
  let firestore: Firestore;
  let firestoreEventStore: FirestoreEventStore;
  let eventStoreAdapter: FirestoreEventStoreAdapter;
  let repository: AccountRepository;
  let useCase: CreateAccountCommand;

  beforeAll(async () => {
    prisma = await setupTestDatabase();
    firestore = await setupFirestoreTest();
    firestoreEventStore = new FirestoreEventStore(firestore);
  });

  beforeEach(() => {
    eventStoreAdapter = new FirestoreEventStoreAdapter(firestoreEventStore, 'Account');
    const repositoryForProjections = new AccountRepository(eventStoreAdapter);
    const projectionRegistry = new AccountProjectionRegistry(prisma as any, repositoryForProjections);
    repository = new AccountRepository(eventStoreAdapter, projectionRegistry);
    useCase = new CreateAccountCommand(repository);
  });

  afterAll(async () => {
    await teardownTestDatabase(prisma);
    await teardownFirestoreTest(firestore);
  });

  afterEach(async () => {
    await cleanupFirestoreTest(firestore);
    await cleanupTestDatabase(prisma);
  });

  describe('execute', () => {
    it('残高ゼロのアカウントを作成できる', async () => {
      const userId = 'test-user-1';
      const result = await useCase.execute({ userId, initialBalance: 0 });

      expect(result).toMatchObject({
        id: expect.any(String),
        userId: userId,
        balance: 0,
        status: 'ACTIVE',
        createdAt: expect.any(String),
      });

      const dbAccount = await prisma.account.findUnique({
        where: { id: result.id },
      });

      expect(dbAccount).toBeDefined();
      expect(dbAccount!.userId).toBe(userId);
      expect(dbAccount!.balance).toBe(0);
      expect(dbAccount!.status).toBe('ACTIVE');
    });

    it('指定した初期残高でアカウントを作成できる', async () => {
      const userId = 'test-user-2';
      const initialBalance = 1000;
      const result = await useCase.execute({ userId, initialBalance });

      expect(result).toMatchObject({
        id: expect.any(String),
        userId: userId,
        balance: initialBalance,
        status: 'ACTIVE',
        createdAt: expect.any(String),
      });

      const dbAccount = await prisma.account.findUnique({
        where: { id: result.id },
      });

      expect(dbAccount).toBeDefined();
      expect(dbAccount!.userId).toBe(userId);
      expect(dbAccount!.balance).toBe(initialBalance);
    });

    it('負の初期残高は拒否される', async () => {
      const userId = 'test-user-3';
      await expect(useCase.execute({ userId, initialBalance: -100 })).rejects.toThrow(
        'Invalid balance'
      );

      const accounts = await prisma.account.findMany();
      expect(accounts).toHaveLength(0);
    });

    it('複数のアカウントを一意のIDで作成できる', async () => {
      const userId = 'test-user-4';
      const result1 = await useCase.execute({ userId, initialBalance: 100 });
      const result2 = await useCase.execute({ userId, initialBalance: 200 });

      expect(result1.id).not.toBe(result2.id);

      const accounts = await prisma.account.findMany();
      expect(accounts).toHaveLength(2);
    });

    it('コマンド実行後にRDBにprojectionが正しく反映される', async () => {
      const userId = 'test-user-5';
      const initialBalance = 5000;

      // アカウント作成前: RDBに存在しない
      const accountsBefore = await prisma.account.findMany();
      expect(accountsBefore).toHaveLength(0);

      // コマンド実行
      const result = await useCase.execute({ userId, initialBalance });

      // アカウント作成後: RDBにprojectionが反映されている
      const dbAccount = await prisma.account.findUnique({
        where: { id: result.id },
      });

      // Projectionが正しく動作していることを確認
      expect(dbAccount).toBeDefined();
      expect(dbAccount!.id).toBe(result.id);
      expect(dbAccount!.userId).toBe(userId);
      expect(dbAccount!.balance).toBe(initialBalance);
      expect(dbAccount!.status).toBe('ACTIVE');
      expect(dbAccount!.createdAt).toBeInstanceOf(Date);

      // Event Storeから再生した状態とRDBの状態が一致することを確認
      const accountId = AccountId.create(result.id);
      const replayedAccount = await repository.replayById(accountId);
      expect(replayedAccount).toBeDefined();
      expect(dbAccount!.userId).toBe(replayedAccount!.userId);
      expect(dbAccount!.balance).toBe(replayedAccount!.balance.getValue());
      expect(dbAccount!.status).toBe(replayedAccount!.status.getValue());
    });
  });
});
