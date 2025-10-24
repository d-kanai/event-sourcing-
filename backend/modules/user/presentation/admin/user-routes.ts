import { Hono } from 'hono';
import { VerifyUserCommand } from '../../application/admin/verify-user-command';
import { ListUsersQuery } from '../../application/admin/list-users-query';
import { GetUserQuery } from '../../application/customer/get-user-query';
import { UserRepository } from '../../infrastructure/repositories/user-repository';
import { UserReadRepository } from '../../infrastructure/repositories/user-read-repository';

const adminRoutes = new Hono<{
  Variables: {
    userRepository: UserRepository;
    userReadRepository: UserReadRepository;
  };
}>();

adminRoutes.get('/', async (c) => {
  try {
    const readRepository = c.var.userReadRepository;
    const query = new ListUsersQuery(readRepository);
    const result = await query.execute();
    return c.json(result);
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      400
    );
  }
});

adminRoutes.get('/:userId', async (c) => {
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

adminRoutes.post('/:userId/verify', async (c) => {
  try {
    const { userId } = c.req.param();
    const repository = c.var.userRepository;
    const command = new VerifyUserCommand(repository);
    const result = await command.execute({ userId });
    return c.json(result);
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      400
    );
  }
});

export { adminRoutes };
