import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { getFirestore } from '../../../../shared/infrastructure/event-store/firestore-client';
import { FirestoreEventStore } from '../../../../shared/infrastructure/event-store/firestore-event-store';
import { FirestoreEventStoreAdapter } from '../../../../shared/infrastructure/event-store/firestore-event-store-adapter';
import { AccountRepository } from '../../infrastructure/repositories/account-repository';
import { AccountReadRepository } from '../../infrastructure/repositories/account-read-repository';
import { CreateAccountCommand } from '../../application/commands/create-account-command';
import { DepositCommand } from '../../application/commands/deposit-command';
import { WithdrawCommand } from '../../application/commands/withdraw-command';
import { GetAccountQuery } from '../../application/queries/get-account-query';

const accountRoutes = new Hono();

const prisma = new PrismaClient();
const firestore = getFirestore();
const firestoreEventStore = new FirestoreEventStore(firestore);
const eventStoreAdapter = new FirestoreEventStoreAdapter(firestoreEventStore, 'Account');
const accountRepository = new AccountRepository(eventStoreAdapter);
const accountReadRepository = new AccountReadRepository(prisma);

const createAccountSchema = z.object({
  userId: z.string().min(1),
  initialBalance: z.number().nonnegative().optional(),
});

accountRoutes.post(
  '/',
  zValidator('json', createAccountSchema),
  async (c) => {
    try {
      const input = c.req.valid('json');
      const command = new CreateAccountCommand(accountRepository);
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

accountRoutes.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const query = new GetAccountQuery(accountReadRepository);
    const result = await query.execute({ id });

    if (!result) {
      return c.json({ error: 'Account not found' }, 404);
    }

    return c.json(result);
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      400
    );
  }
});

const depositSchema = z.object({
  amount: z.number().positive(),
});

accountRoutes.post(
  '/:id/deposit',
  zValidator('json', depositSchema),
  async (c) => {
    try {
      const accountId = c.req.param('id');
      const { amount } = c.req.valid('json');
      const command = new DepositCommand(accountRepository);
      const result = await command.execute({ accountId, amount });
      return c.json(result);
    } catch (error) {
      return c.json(
        { error: error instanceof Error ? error.message : 'Unknown error' },
        400
      );
    }
  }
);

const withdrawSchema = z.object({
  amount: z.number().positive(),
});

accountRoutes.post(
  '/:id/withdraw',
  zValidator('json', withdrawSchema),
  async (c) => {
    try {
      const accountId = c.req.param('id');
      const { amount } = c.req.valid('json');
      const command = new WithdrawCommand(accountRepository);
      const result = await command.execute({ accountId, amount });
      return c.json(result);
    } catch (error) {
      return c.json(
        { error: error instanceof Error ? error.message : 'Unknown error' },
        400
      );
    }
  }
);

export { accountRoutes };
