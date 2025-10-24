import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { CreateAccountCommand } from '../../application/admin/create-account-command';
import { DepositCommand } from '../../application/admin/deposit-command';
import { WithdrawCommand } from '../../application/admin/withdraw-command';
import { AccountRepository } from '../../infrastructure/repositories/account-repository';
import { AccountReadRepository } from '../../infrastructure/repositories/account-read-repository';

const adminRoutes = new OpenAPIHono<{
  Variables: {
    accountRepository: AccountRepository;
    accountReadRepository: AccountReadRepository;
  };
}>();

const ErrorResponseSchema = z
  .object({
    error: z.string(),
  })
  .openapi({ description: 'Error response', example: { error: 'Unknown error' } });

const AccountResponseSchema = z
  .object({
    id: z.string(),
    userId: z.string(),
    balance: z.number(),
    status: z.string(),
    createdAt: z.string().datetime(),
  })
  .openapi({ title: 'Account', description: 'Account aggregate state' });

const CreateAccountRequestSchema = z
  .object({
    userId: z.string().min(1).openapi({ example: 'user-123' }),
    initialBalance: z.number().nonnegative().optional().openapi({ example: 0 }),
  })
  .openapi({ title: 'CreateAccountInput' });

const AmountSchema = z
  .object({
    amount: z.number().positive().openapi({ example: 1000 }),
  })
  .openapi({ title: 'MoneyAmountInput' });

const createAccountRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Admin', 'Accounts'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateAccountRequestSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Account created',
      content: {
        'application/json': {
          schema: AccountResponseSchema,
        },
      },
    },
    400: {
      description: 'Account creation failed',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

adminRoutes.openapi(createAccountRoute, async (c) => {
  try {
    const { userId, initialBalance = 0 } = c.req.valid('json');
    const repository = c.var.accountRepository;
    const command = new CreateAccountCommand(repository);
    const result = await command.execute({ userId, initialBalance });
    return c.json(result, 201);
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      400
    );
  }
});

const depositRoute = createRoute({
  method: 'post',
  path: '/{id}/deposit',
  tags: ['Admin', 'Accounts'],
  request: {
    params: z
      .object({
        id: z.string().openapi({ description: 'Account identifier' }),
      })
      .openapi('Account path parameters'),
    body: {
      content: {
        'application/json': {
          schema: AmountSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Deposit applied',
      content: {
        'application/json': {
          schema: AccountResponseSchema,
        },
      },
    },
    400: {
      description: 'Deposit failed',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

adminRoutes.openapi(depositRoute, async (c) => {
  try {
    const accountId = c.req.param('id');
    const { amount } = c.req.valid('json');
    const repository = c.var.accountRepository;
    const command = new DepositCommand(repository);
    const result = await command.execute({ accountId, amount });
    return c.json(result, 200);
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      400
    );
  }
});

const withdrawRoute = createRoute({
  method: 'post',
  path: '/{id}/withdraw',
  tags: ['Admin', 'Accounts'],
  request: {
    params: z
      .object({
        id: z.string().openapi({ description: 'Account identifier' }),
      })
      .openapi('Account path parameters'),
    body: {
      content: {
        'application/json': {
          schema: AmountSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Withdrawal applied',
      content: {
        'application/json': {
          schema: AccountResponseSchema,
        },
      },
    },
    400: {
      description: 'Withdrawal failed',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

adminRoutes.openapi(withdrawRoute, async (c) => {
  try {
    const accountId = c.req.param('id');
    const { amount } = c.req.valid('json');
    const repository = c.var.accountRepository;
    const command = new WithdrawCommand(repository);
    const result = await command.execute({ accountId, amount });
    return c.json(result, 200);
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      400
    );
  }
});

export { adminRoutes };
