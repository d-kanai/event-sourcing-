import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { accountRoutes } from './modules/account/presentation/routes/account-routes';

const app = new Hono();

app.use('*', logger());

app.get('/', (c) => {
  return c.json({ message: 'Event Sourcing API' });
});

app.route('/accounts', accountRoutes);

export default app;
