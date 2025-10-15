import { getFirestore } from '../../shared/infrastructure/event-store/firestore-client';
import { UserEventType } from '../user/domain/events/user-event-type';

const firestore = getFirestore();

console.log('Account Service Event Listener starting...');

const eventsRef = firestore.collection('events');

const unsubscribe = eventsRef
  .where('processed', '==', false)
  .onSnapshot(
    (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'added') {
          const event = change.doc.data();
          const eventId = change.doc.id;

          console.log(`Received event: ${event.eventType}`, event);

          try {
            if (event.eventType === UserEventType.USER_CREATED) {
              await handleUserCreated(event);
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
