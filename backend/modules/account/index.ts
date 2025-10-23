import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { serve } from '@hono/node-server';
import { accountRoutes } from './presentation/routes/account-routes';

const app = new Hono();

app.use('*', logger());

app.get('/', (c) => {
  return c.json({ message: 'Account Service API' });
});

app.route('/accounts', accountRoutes);

const port = Number(process.env.ACCOUNT_SERVICE_PORT) || 3000;

serve({
  fetch: app.fetch,
  port,
});

console.log(`Account Service running on port ${port}`);
