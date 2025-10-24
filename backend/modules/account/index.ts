import { OpenAPIHono } from '@hono/zod-openapi';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serve } from '@hono/node-server';
import { PrismaClient } from '@prisma/client';
import { getFirestore } from '../../shared/infrastructure/event-store/firestore-client';
import { FirestoreEventStore } from '../../shared/infrastructure/event-store/firestore-event-store';
import { FirestoreEventStoreAdapter } from '../../shared/infrastructure/event-store/firestore-event-store-adapter';
import { AccountRepository } from './infrastructure/repositories/account-repository';
import { AccountReadRepository } from './infrastructure/repositories/account-read-repository';
import { AccountProjectionRegistry } from './infrastructure/projections/account-projection-registry';
import { adminRoutes } from './presentation/admin/account-routes';
import { customerRoutes } from './presentation/customer/account-routes';

const prisma = new PrismaClient();
const firestore = getFirestore();
const firestoreEventStore = new FirestoreEventStore(firestore);
const eventStoreAdapter = new FirestoreEventStoreAdapter(firestoreEventStore, 'Account');
const repositoryForProjections = new AccountRepository(eventStoreAdapter);
const projectionRegistry = new AccountProjectionRegistry(prisma, repositoryForProjections);
const accountRepository = new AccountRepository(eventStoreAdapter, projectionRegistry);
const accountReadRepository = new AccountReadRepository(prisma);

const app = new OpenAPIHono<{
  Variables: {
    accountRepository: AccountRepository;
    accountReadRepository: AccountReadRepository;
  };
}>();

app.use('*', cors());
app.use('*', logger());
app.use('*', async (c, next) => {
  c.set('accountRepository', accountRepository);
  c.set('accountReadRepository', accountReadRepository);
  await next();
});

app.get('/', (c) => {
  return c.json({ message: 'Account Service API' });
});

app.route('/customer/accounts', customerRoutes);
app.route('/admin/accounts', adminRoutes);

app.doc('/openapi.json', {
  openapi: '3.1.0',
  info: {
    title: 'Account Service API',
    version: '1.0.0',
  },
});

app.get('/openapi', (c) => c.redirect('/openapi.json'));

const port = Number(process.env.ACCOUNT_SERVICE_PORT) || 3000;

serve({
  fetch: app.fetch,
  port,
});

console.log(`Account Service running on port ${port}`);
