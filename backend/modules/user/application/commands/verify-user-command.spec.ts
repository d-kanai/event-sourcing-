import { PrismaClient } from '../../infrastructure/prisma/generated/test-client';
import {
  setupTestDatabase,
  teardownTestDatabase,
  cleanupTestDatabase,
} from '../../infrastructure/prisma/test-helper';
import { RegisterUserCommand } from './register-user-command';
import { VerifyUserCommand } from './verify-user-command';
import { UserRepository } from '../../infrastructure/repositories/user-repository';
import { UserProjectionRegistry } from '../../infrastructure/projections/user-projection-registry';
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

describe('VerifyUserCommand', () => {
  let prisma: PrismaClient;
  let firestore: Firestore;
  let firestoreEventStore: FirestoreEventStore;
  let eventStoreAdapter: FirestoreEventStoreAdapter;
  let repository: UserRepository;
  let registerCommand: RegisterUserCommand;
  let verifyCommand: VerifyUserCommand;

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
    registerCommand = new RegisterUserCommand(repository);
    verifyCommand = new VerifyUserCommand(repository);
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
    it('登録済みユーザーを認証できる', async () => {
      const registered = await registerCommand.execute({
        email: 'verify@example.com',
        name: 'Verify User',
      });

      const result = await verifyCommand.execute({ userId: registered.id });

      expect(result).toMatchObject({
        id: registered.id,
        email: registered.email,
        name: registered.name,
        status: 'VERIFIED',
        createdAt: expect.any(String),
      });

      const dbUser = await prisma.user.findUnique({
        where: { id: registered.id },
      });

      expect(dbUser).toBeDefined();
      expect(dbUser!.status).toBe('VERIFIED');
    });

    it('存在しないユーザーIDではエラーを投げる', async () => {
      await expect(
        verifyCommand.execute({ userId: 'non-existent-id' })
      ).rejects.toThrow('User not found');
    });

    it('コマンド実行後にRDBにprojectionが正しく反映される', async () => {
      const registered = await registerCommand.execute({
        email: 'projection-verify@example.com',
        name: 'Projection Verify User',
      });

      // 認証前: ステータスがPENDING_VERIFICATION
      const userBefore = await prisma.user.findUnique({
        where: { id: registered.id },
      });
      expect(userBefore!.status).toBe('PENDING_VERIFICATION');

      // 認証実行
      await verifyCommand.execute({ userId: registered.id });

      // 認証後: ステータスがVERIFIED
      const userAfter = await prisma.user.findUnique({
        where: { id: registered.id },
      });
      expect(userAfter!.status).toBe('VERIFIED');
    });
  });
});
