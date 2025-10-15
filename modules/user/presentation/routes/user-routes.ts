import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { getFirestore } from '../../../../shared/infrastructure/event-store/firestore-client';
import { FirestoreEventStore } from '../../../../shared/infrastructure/event-store/firestore-event-store';
import { FirestoreEventStoreAdapter } from '../../../../shared/infrastructure/event-store/firestore-event-store-adapter';
import { UserRepository } from '../../infrastructure/repositories/user-repository';
import { UserReadRepository } from '../../infrastructure/repositories/user-read-repository';
import { RegisterUserCommand } from '../../application/commands/register-user-command';
import { VerifyUserCommand } from '../../application/commands/verify-user-command';
import { GetUserQuery } from '../../application/queries/get-user-query';
import { UserProjectionRegistry } from '../../infrastructure/projections/user-projection-registry';

const userRoutes = new Hono();

const prisma = new PrismaClient();
const firestore = getFirestore();
const firestoreEventStore = new FirestoreEventStore(firestore);
const eventStoreAdapter = new FirestoreEventStoreAdapter(firestoreEventStore, 'User');
const userRepository = new UserRepository(eventStoreAdapter);
const userReadRepository = new UserReadRepository(prisma);

const registerUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
});

userRoutes.post(
  '/',
  zValidator('json', registerUserSchema),
  async (c) => {
    try {
      const input = c.req.valid('json');
      const command = new RegisterUserCommand(userRepository);
      const result = await command.execute(input);
      return c.json(result, 201);
    } catch (error) {
      return c.json(
        { error: error instanceof Error ? error.message : 'Unknown error' },
        400
      );
    }
  }
);

userRoutes.post('/:userId/verify', async (c) => {
  try {
    const userId = c.req.param('userId');
    const command = new VerifyUserCommand(userRepository);
    const result = await command.execute({ userId });
    return c.json(result);
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      400
    );
  }
});

userRoutes.get('/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');
    const query = new GetUserQuery(userReadRepository);
    const result = await query.execute(userId);

    if (!result) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json(result);
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      400
    );
  }
});

export { userRoutes };
