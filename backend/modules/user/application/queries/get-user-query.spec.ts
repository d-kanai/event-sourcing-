import { PrismaClient } from '../../infrastructure/prisma/generated/test-client';
import {
  setupTestDatabase,
  teardownTestDatabase,
  cleanupTestDatabase,
} from '../../infrastructure/prisma/test-helper';
import { GetUserQuery } from './get-user-query';
import { RegisterUserCommand } from '../commands/register-user-command';
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
import { UserRepository } from '../../infrastructure/repositories/user-repository';
import { UserReadRepository } from '../../infrastructure/repositories/user-read-repository';
import { UserProjectionRegistry } from '../../infrastructure/projections/user-projection-registry';

describe('GetUserQuery', () => {
  let prisma: PrismaClient;
  let firestore: Firestore;
  let firestoreEventStore: FirestoreEventStore;
  let eventStoreAdapter: FirestoreEventStoreAdapter;
  let repository: UserRepository;
  let readRepository: UserReadRepository;
  let query: GetUserQuery;
  let registerCommand: RegisterUserCommand;

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
    readRepository = new UserReadRepository(prisma as any);
    // GetUserQuery uses read repository (Query side of CQRS)
    query = new GetUserQuery(readRepository);
    // RegisterUserCommand uses write repository (Command side of CQRS)
    registerCommand = new RegisterUserCommand(repository);
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
    it('IDで既存のユーザーを取得できる', async () => {
      const registered = await registerCommand.execute({
        email: 'query@example.com',
        name: 'Query User',
      });

      const result = await query.execute(registered.id);

      expect(result).toMatchObject({
        id: registered.id,
        email: registered.email,
        name: registered.name,
        status: 'PENDING_VERIFICATION',
        createdAt: expect.any(String),
      });
    });

    it('存在しないユーザーIDの場合エラーを投げる', async () => {
      await expect(query.execute('non-existent-id')).rejects.toThrow(
        'User not found'
      );
    });

    it('登録後のユーザーを正しいメールアドレスで取得できる', async () => {
      const email = 'specific@example.com';
      const registered = await registerCommand.execute({
        email,
        name: 'Specific User',
      });

      const result = await query.execute(registered.id);

      expect(result).not.toBeNull();
      expect(result.email).toBe(email);
    });

    it('複数の異なるユーザーを正しく取得できる', async () => {
      const user1 = await registerCommand.execute({
        email: 'user1@example.com',
        name: 'User One',
      });
      const user2 = await registerCommand.execute({
        email: 'user2@example.com',
        name: 'User Two',
      });

      const result1 = await query.execute(user1.id);
      const result2 = await query.execute(user2.id);

      expect(result1.email).toBe('user1@example.com');
      expect(result2.email).toBe('user2@example.com');
      expect(result1.id).not.toBe(result2.id);
    });

    it('Read Modelから直接取得できることを確認', async () => {
      const registered = await registerCommand.execute({
        email: 'readmodel@example.com',
        name: 'Read Model User',
      });

      // GetUserQueryはRead Repository (RDB) から取得する
      const result = await query.execute(registered.id);

      // RDBに正しくprojectionされていることを確認
      const dbUser = await prisma.user.findUnique({
        where: { id: registered.id },
      });

      expect(result.id).toBe(dbUser!.id);
      expect(result.email).toBe(dbUser!.email);
      expect(result.name).toBe(dbUser!.name);
      expect(result.status).toBe(dbUser!.status);
    });
  });
});
