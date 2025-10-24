import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { RegisterUserCommand } from '../../application/customer/register-user-command';
import { GetUserQuery } from '../../application/customer/get-user-query';
import { UserRepository } from '../../infrastructure/repositories/user-repository';
import { UserReadRepository } from '../../infrastructure/repositories/user-read-repository';

const customerRoutes = new Hono<{
  Variables: {
    userRepository: UserRepository;
    userReadRepository: UserReadRepository;
  };
}>();

const registerUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
});

customerRoutes.post(
  '/',
  zValidator('json', registerUserSchema),
  async (c) => {
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
  }
);

customerRoutes.get('/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');
    const readRepository = c.var.userReadRepository;
    const query = new GetUserQuery(readRepository);
    const result = await query.execute(userId);

    return c.json(result);
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      400
    );
  }
});

export { customerRoutes };
