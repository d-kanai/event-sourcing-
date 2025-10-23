import { Firestore } from '@google-cloud/firestore';

let firestoreInstance: Firestore | null = null;

export function getFirestore(): Firestore {
  if (!firestoreInstance) {
    const isEmulator = process.env.FIRESTORE_EMULATOR_HOST;

    firestoreInstance = new Firestore({
      projectId: process.env.FIRESTORE_PROJECT_ID || 'event-sourcing-local',
      ...(isEmulator && {
        host: process.env.FIRESTORE_EMULATOR_HOST,
        ssl: false,
      }),
    });
  }

  return firestoreInstance;
}

export function resetFirestore(): void {
  firestoreInstance = null;
}
