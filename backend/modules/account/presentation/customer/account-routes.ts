import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { AccountReadRepository } from '../../infrastructure/repositories/account-read-repository';
import { GetAccountQuery } from '../../application/customer/get-account-query';

const customerRoutes = new OpenAPIHono<{
  Variables: {
    accountReadRepository: AccountReadRepository;
  };
}>();

const ErrorResponseSchema = z
  .object({
    error: z.string(),
  })
  .openapi({
    description: 'Error response',
    example: { error: 'Account not found' },
  });

const AccountSchema = z
  .object({
    id: z.string(),
    userId: z.string(),
    balance: z.number(),
    status: z.string(),
    createdAt: z.string().datetime(),
  })
  .openapi({
    title: 'Account',
    description: 'Account read model representation',
  });

const getAccountRoute = createRoute({
  method: 'get',
  path: '/{id}',
  tags: ['Customer', 'Accounts'],
  request: {
    params: z
      .object({
        id: z.string().openapi({ description: 'Account identifier' }),
      })
      .openapi('Account lookup parameters'),
  },
  responses: {
    200: {
      description: 'Account fetched successfully',
      content: {
        'application/json': {
          schema: AccountSchema,
        },
      },
    },
    404: {
      description: 'Account not found',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
    400: {
      description: 'Lookup failed',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

customerRoutes.openapi(getAccountRoute, async (c) => {
  try {
    const id = c.req.param('id');
    const readRepository = c.var.accountReadRepository;
    const query = new GetAccountQuery(readRepository);
    const result = await query.execute({ id });

    if (!result) {
      return c.json({ error: 'Account not found' }, 404);
    }

    return c.json(result, 200);
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      400
    );
  }
});

export { customerRoutes };
