import { PrismaClient } from '../../infrastructure/prisma/generated/test-client';
import {
  setupTestDatabase,
  teardownTestDatabase,
  cleanupTestDatabase,
} from '../../infrastructure/prisma/test-helper';
import { RegisterUserCommand } from './register-user-command';
import { UserRepository } from '../../infrastructure/repositories/user-repository';
import { UserProjectionRegistry } from '../../infrastructure/projections/user-projection-registry';
import { UserId } from '../../domain/value-objects/user-id';
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

describe('RegisterUserCommand', () => {
  let prisma: PrismaClient;
  let firestore: Firestore;
  let firestoreEventStore: FirestoreEventStore;
  let eventStoreAdapter: FirestoreEventStoreAdapter;
  let repository: UserRepository;
  let command: RegisterUserCommand;

  beforeAll(async () => {
    prisma = await setupTestDatabase();
    firestore = await setupFirestoreTest();
    firestoreEventStore = new FirestoreEventStore(firestore);
  });

  beforeEach(() => {
    eventStoreAdapter = new FirestoreEventStoreAdapter(firestoreEventStore, 'User');
    const repositoryForProjections = new UserRepository(eventStoreAdapter);
    const projectionRegistry = new UserProjectionRegistry(prisma as any, repositoryForProjections);
    repository = new UserRepository(eventStoreAdapter, projectionRegistry);
    command = new RegisterUserCommand(repository);
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
    it('有効なメールアドレスと名前でユーザーを登録できる', async () => {
      const input = {
        email: 'test@example.com',
        name: 'Test User',
      };

      const result = await command.execute(input);

      expect(result).toMatchObject({
        id: expect.any(String),
        email: input.email,
        name: input.name,
        status: 'PENDING_VERIFICATION',
        createdAt: expect.any(String),
      });

      const dbUser = await prisma.user.findUnique({
        where: { id: result.id },
      });

      expect(dbUser).toBeDefined();
      expect(dbUser!.email).toBe(input.email);
      expect(dbUser!.name).toBe(input.name);
      expect(dbUser!.status).toBe('PENDING_VERIFICATION');
    });

    it('複数のユーザーを一意のIDで登録できる', async () => {
      const result1 = await command.execute({
        email: 'user1@example.com',
        name: 'User One',
      });

      const result2 = await command.execute({
        email: 'user2@example.com',
        name: 'User Two',
      });

      expect(result1.id).not.toBe(result2.id);

      const users = await prisma.user.findMany();
      expect(users).toHaveLength(2);
    });

    it('コマンド実行後にRDBにprojectionが正しく反映される', async () => {
      const input = {
        email: 'projection@example.com',
        name: 'Projection Test',
      };

      // ユーザー作成前: RDBに存在しない
      const usersBefore = await prisma.user.findMany();
      expect(usersBefore).toHaveLength(0);

      // コマンド実行
      const result = await command.execute(input);

      // ユーザー作成後: RDBにprojectionが反映されている
      const dbUser = await prisma.user.findUnique({
        where: { id: result.id },
      });

      // Projectionが正しく動作していることを確認
      expect(dbUser).toBeDefined();
      expect(dbUser!.id).toBe(result.id);
      expect(dbUser!.email).toBe(input.email);
      expect(dbUser!.name).toBe(input.name);
      expect(dbUser!.status).toBe('PENDING_VERIFICATION');
      expect(dbUser!.createdAt).toBeInstanceOf(Date);

      // Event Storeから再生した状態とRDBの状態が一致することを確認
      const userId = UserId.create(result.id);
      const replayedUser = await repository.replayById(userId);
      expect(replayedUser).toBeDefined();
      expect(dbUser!.email).toBe(replayedUser!.email.getValue());
      expect(dbUser!.name).toBe(replayedUser!.name.getValue());
      expect(dbUser!.status).toBe(replayedUser!.status.getValue());
    });
  });
});
