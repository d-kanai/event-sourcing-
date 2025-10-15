export {
  BaseEventSourcedRepository,
  EventStore,
  Snapshot,
  SnapshotRepository,
  ProjectionRegistry,
  RehydratorStatic,
} from './base-event-sourced-repository';

export { EventStoreClient } from './event-store-client';
export { InMemoryEventStore } from './in-memory-event-store';
export { FirestoreEventStore } from './firestore-event-store';
export { FirestoreEventStoreAdapter } from './firestore-event-store-adapter';
export { getFirestore, resetFirestore } from './firestore-client';
