import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { RegisterUserCommand } from '../../application/customer/register-user-command';
import { GetUserQuery } from '../../application/customer/get-user-query';
import { UserRepository } from '../../infrastructure/repositories/user-repository';
import { UserReadRepository } from '../../infrastructure/repositories/user-read-repository';

const customerRoutes = new OpenAPIHono<{
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

const RegisterUserRequestSchema = z
  .object({
    email: z.string().email().openapi({ example: 'user@example.com' }),
    name: z.string().min(1).openapi({ example: '山田 太郎' }),
  })
  .openapi({
    title: 'RegisterUserInput',
    description: 'Input required to register a customer user',
  });

const UserResponseSchema = z
  .object({
    id: z.string().openapi({ description: 'User ID' }),
    email: z.string().email(),
    name: z.string(),
    status: z.enum(['PENDING_VERIFICATION', 'VERIFIED']),
    createdAt: z.string().datetime(),
  })
  .openapi({
    title: 'User',
    description: 'Basic representation of a user',
  });

const registerRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Customer', 'Users'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: RegisterUserRequestSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'User successfully registered',
      content: {
        'application/json': {
          schema: UserResponseSchema,
        },
      },
    },
    400: {
      description: 'Registration failed',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

customerRoutes.openapi(registerRoute, async (c) => {
  try {
    const input = c.req.valid('json');
    const repository = c.var.userRepository;
    const command = new RegisterUserCommand(repository);
    const result = await command.execute(input);
    return c.json(result, 201);
  } catch (error) {
    console.error('[customer][users] register failed', error);
    return c.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      400
    );
  }
});

const getUserRoute = createRoute({
  method: 'get',
  path: '/{userId}',
  tags: ['Customer', 'Users'],
  request: {
    params: z
      .object({
        userId: z.string().openapi({ description: 'User identifier' }),
      })
      .openapi('User path parameters'),
  },
  responses: {
    200: {
      description: 'User fetched successfully',
      content: {
        'application/json': {
          schema: UserResponseSchema,
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

customerRoutes.openapi(getUserRoute, async (c) => {
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

export { customerRoutes };
