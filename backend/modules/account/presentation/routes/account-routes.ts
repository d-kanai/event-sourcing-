import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { prisma } from '../../infrastructure/prisma/client';
import { PrismaAccountRepository } from '../../infrastructure/repositories/prisma-account-repository';
import { CreateAccountUseCase } from '../../application/use-cases/create-account';
import { GetAccountUseCase } from '../../application/use-cases/get-account';
import { DepositUseCase } from '../../application/use-cases/deposit';
import { WithdrawUseCase } from '../../application/use-cases/withdraw';

const accountRoutes = new Hono();

const accountRepository = new PrismaAccountRepository(prisma);

// Create account
const createAccountSchema = z.object({
  initialBalance: z.number().nonnegative().optional(),
});

accountRoutes.post(
  '/',
  zValidator('json', createAccountSchema),
  async (c) => {
    try {
      const input = c.req.valid('json');
      const useCase = new CreateAccountUseCase(accountRepository);
      const result = await useCase.execute(input);
      return c.json(result, 201);
    } catch (error) {
      return c.json(
        { error: error instanceof Error ? error.message : 'Unknown error' },
        400
      );
    }
  }
);

// Get account by ID
accountRoutes.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const useCase = new GetAccountUseCase(accountRepository);
    const result = await useCase.execute({ id });

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

// Deposit
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
      const useCase = new DepositUseCase(accountRepository);
      const result = await useCase.execute({ accountId, amount });
      return c.json(result);
    } catch (error) {
      return c.json(
        { error: error instanceof Error ? error.message : 'Unknown error' },
        400
      );
    }
  }
);

// Withdraw
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
      const useCase = new WithdrawUseCase(accountRepository);
      const result = await useCase.execute({ accountId, amount });
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
