import { Firestore } from '@google-cloud/firestore';
import { getFirestore } from './firestore-client';

let firestoreInstance: Firestore | null = null;

export async function setupFirestoreTest(): Promise<Firestore> {
  const host = process.env.FIRESTORE_EMULATOR_HOST ?? 'localhost:8085';
  process.env.FIRESTORE_EMULATOR_HOST = host;
  process.env.FIRESTORE_PROJECT_ID = 'event-sourcing-local';

  firestoreInstance = getFirestore();
  return firestoreInstance;
}

export async function cleanupFirestoreTest(firestore: Firestore): Promise<void> {
  const collections = ['events', 'aggregates'];

  for (const collectionName of collections) {
    const snapshot = await firestore.collection(collectionName).get();
    const batch = firestore.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  }
}

export async function teardownFirestoreTest(firestore: Firestore): Promise<void> {
  await firestore.terminate();
  firestoreInstance = null;
}
