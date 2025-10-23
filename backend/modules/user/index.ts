import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { serve } from '@hono/node-server';
import { userRoutes } from './presentation/routes/user-routes';

const app = new Hono();

app.use('*', logger());

app.get('/', (c) => {
  return c.json({ message: 'User Service API' });
});

app.route('/users', userRoutes);

const port = Number(process.env.USER_SERVICE_PORT) || 3001;

serve({
  fetch: app.fetch,
  port,
});

console.log(`User Service running on port ${port}`);
