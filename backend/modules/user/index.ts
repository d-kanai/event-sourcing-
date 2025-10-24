import { OpenAPIHono } from '@hono/zod-openapi';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serve } from '@hono/node-server';
import { adminRoutes } from './presentation/admin/user-routes';
import { customerRoutes } from './presentation/customer/user-routes';
import { UserRepository } from './infrastructure/repositories/user-repository';
import { UserReadRepository } from './infrastructure/repositories/user-read-repository';
import { getFirestore } from '../../shared/infrastructure/event-store/firestore-client';
import { FirestoreEventStore } from '../../shared/infrastructure/event-store/firestore-event-store';
import { FirestoreEventStoreAdapter } from '../../shared/infrastructure/event-store/firestore-event-store-adapter';
import { PrismaClient } from '@prisma/user-client';
import { UserProjectionRegistry } from './infrastructure/projections/user-projection-registry';

const prisma = new PrismaClient();
const firestore = getFirestore();
const firestoreEventStore = new FirestoreEventStore(firestore);
const eventStoreAdapter = new FirestoreEventStoreAdapter(firestoreEventStore, 'User');
const repositoryForProjections = new UserRepository(eventStoreAdapter);
const projectionRegistry = new UserProjectionRegistry(prisma, repositoryForProjections);
const userRepository = new UserRepository(eventStoreAdapter, projectionRegistry);
const userReadRepository = new UserReadRepository(prisma);

const app = new OpenAPIHono<{
  Variables: {
    userRepository: UserRepository;
    userReadRepository: UserReadRepository;
  };
}>();

app.use('*', cors());
app.use('*', logger());
app.use('*', async (c, next) => {
  c.set('userRepository', userRepository);
  c.set('userReadRepository', userReadRepository);
  await next();
});

app.get('/', (c) => {
  return c.json({ message: 'User Service API' });
});

app.route('/customer/users', customerRoutes);
app.route('/admin/users', adminRoutes);

app.doc('/openapi.json', {
  openapi: '3.1.0',
  info: {
    title: 'User Service API',
    version: '1.0.0',
  },
});

app.get('/openapi', (c) => c.redirect('/openapi.json'));

const port = Number(process.env.USER_SERVICE_PORT) || 3001;

serve({
  fetch: app.fetch,
  port,
});

console.log(`User Service running on port ${port}`);
