import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { VerifyUserCommand } from '../../application/admin/verify-user-command';
import { ListUsersQuery } from '../../application/admin/list-users-query';
import { GetUserQuery } from '../../application/customer/get-user-query';
import { UserRepository } from '../../infrastructure/repositories/user-repository';
import { UserReadRepository } from '../../infrastructure/repositories/user-read-repository';

const adminRoutes = new OpenAPIHono<{
  Variables: {
    userRepository: UserRepository;
    userReadRepository: UserReadRepository;
  };
}>();

const ErrorResponseSchema = z
  .object({
    error: z.string(),
  })
  .openapi({
    description: 'Error response payload',
    example: { error: 'Unknown error' },
  });

const UserSchema = z
  .object({
    id: z.string(),
    email: z.string().email(),
    name: z.string(),
    status: z.enum(['PENDING_VERIFICATION', 'VERIFIED']),
    createdAt: z.string().datetime(),
  })
  .openapi({
    title: 'User',
    description: 'User projection returned to the admin console',
  });

const UsersListSchema = z
  .object({
    users: z.array(UserSchema),
  })
  .openapi({
    title: 'UserList',
    description: 'Collection of users',
  });

const listUsersRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Admin', 'Users'],
  responses: {
    200: {
      description: 'List users',
      content: {
        'application/json': {
          schema: UsersListSchema,
        },
      },
    },
    400: {
      description: 'Failed to list users',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

adminRoutes.openapi(listUsersRoute, async (c) => {
  try {
    const readRepository = c.var.userReadRepository;
    const query = new ListUsersQuery(readRepository);
    const result = await query.execute();
    return c.json(result, 200);
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      400
    );
  }
});

const getUserRoute = createRoute({
  method: 'get',
  path: '/{userId}',
  tags: ['Admin', 'Users'],
  request: {
    params: z
      .object({
        userId: z.string().openapi({ description: 'User identifier' }),
      })
      .openapi('Admin user lookup parameters'),
  },
  responses: {
    200: {
      description: 'User fetched successfully',
      content: {
        'application/json': {
          schema: UserSchema,
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

adminRoutes.openapi(getUserRoute, async (c) => {
  try {
    const userId = c.req.param('userId');
    const readRepository = c.var.userReadRepository;
    const query = new GetUserQuery(readRepository);
    const result = await query.execute(userId);

    return c.json(result, 200);
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      400
    );
  }
});

const verifyUserRoute = createRoute({
  method: 'post',
  path: '/{userId}/verify',
  tags: ['Admin', 'Users'],
  request: {
    params: z
      .object({
        userId: z.string().openapi({ description: 'User identifier' }),
      })
      .openapi('User verification parameters'),
  },
  responses: {
    200: {
      description: 'Verification succeeded',
      content: {
        'application/json': {
          schema: UserSchema,
        },
      },
    },
    400: {
      description: 'Verification failed',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

adminRoutes.openapi(verifyUserRoute, async (c) => {
  try {
    const { userId } = c.req.param();
    const repository = c.var.userRepository;
    const command = new VerifyUserCommand(repository);
    const result = await command.execute({ userId });
    return c.json(result, 200);
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      400
    );
  }
});

export { adminRoutes };
