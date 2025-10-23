import { getFirestore } from '../../shared/infrastructure/event-store/firestore-client';
import { UserEventType } from '../user/domain/events/user-event-type';
import { CreateAccountCommand } from './application/commands/create-account-command';
import { AccountRepository } from './infrastructure/repositories/account-repository';
import { AccountProjectionRegistry } from './infrastructure/projections/account-projection-registry';
import { FirestoreEventStore, FirestoreEventStoreAdapter } from '../../shared/infrastructure/event-store';
import { PrismaClient } from '@prisma/client';

const firestore = getFirestore();
const prisma = new PrismaClient();
const firestoreEventStore = new FirestoreEventStore(firestore);
const eventStoreAdapter = new FirestoreEventStoreAdapter(firestoreEventStore, 'Account');
const repositoryForProjections = new AccountRepository(eventStoreAdapter);
const projectionRegistry = new AccountProjectionRegistry(prisma, repositoryForProjections);
const accountRepository = new AccountRepository(eventStoreAdapter, projectionRegistry);
const createAccountCommand = new CreateAccountCommand(accountRepository);

console.log('Account Service Event Listener starting...');

const eventsRef = firestore.collection('events');

console.log('Setting up Firestore listener for unprocessed events...');

const unsubscribe = eventsRef
  .where('processed', '==', false)
  .onSnapshot(
    (snapshot) => {
      console.log(`Snapshot received with ${snapshot.size} documents`);
      snapshot.docChanges().forEach(async (change) => {
        console.log(`Document change type: ${change.type}`);
        if (change.type === 'added') {
          const event = change.doc.data();
          const eventId = change.doc.id;

          console.log(`Received event: ${event.eventType}`, JSON.stringify(event, null, 2));

          try {
            if (event.eventType === UserEventType.USER_CREATED) {
              console.log('Detected USER_CREATED event, calling handleUserCreated...');
              await handleUserCreated(event);
            } else {
              console.log(`Ignoring event type: ${event.eventType}`);
            }

            await change.doc.ref.update({ processed: true });
            console.log(`Event ${eventId} marked as processed`);
          } catch (error) {
            console.error(`Error processing event ${eventId}:`, error);
          }
        }
      });
    },
    (error) => {
      console.error('Error listening to events:', error);
    }
  );

async function handleUserCreated(event: any) {
  console.log('Handling UserCreated event:', event.data);

  const userId = event.data.userId;
  const initialBalance = 0;

  console.log(`Creating account for user ${userId} with initial balance ${initialBalance}`);

  const account = await createAccountCommand.execute({ userId, initialBalance });

  console.log(`Account created successfully: ${account.id}`);
}

process.on('SIGINT', () => {
  console.log('Stopping event listener...');
  unsubscribe();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Stopping event listener...');
  unsubscribe();
  process.exit(0);
});
