import { Firestore, Timestamp } from '@google-cloud/firestore';
import { DomainEvent } from '../../domain/events/domain-event';

export interface FirestoreEventDocument {
  aggregateId: string;
  aggregateType: string;
  version: number;
  eventType: string;
  data: any;
  metadata: any;
  timestamp: Timestamp;
}

export class FirestoreEventStore {
  private readonly eventsCollection = 'events';
  private readonly aggregatesCollection = 'aggregates';

  constructor(private readonly firestore: Firestore) {}

  async save(
    aggregateId: string,
    aggregateType: string,
    events: DomainEvent[],
    expectedVersion: number
  ): Promise<void> {
    if (events.length === 0) return;

    const batch = this.firestore.batch();
    const aggregateRef = this.firestore
      .collection(this.aggregatesCollection)
      .doc(`${aggregateType}-${aggregateId}`);

    try {
      const aggregateDoc = await aggregateRef.get();
      const currentVersion = aggregateDoc.exists
        ? aggregateDoc.data()?.version || 0
        : 0;

      if (currentVersion !== expectedVersion) {
        throw new Error(
          `Concurrency conflict: expected version ${expectedVersion}, but current version is ${currentVersion}`
        );
      }

      events.forEach((event, index) => {
        const eventRef = this.firestore.collection(this.eventsCollection).doc();
        const eventDoc: FirestoreEventDocument = {
          aggregateId,
          aggregateType,
          version: expectedVersion + index + 1,
          eventType: event.eventType,
          data: event.data,
          metadata: event.metadata || {},
          timestamp: Timestamp.now(),
        };
        batch.set(eventRef, eventDoc);
      });

      batch.set(
        aggregateRef,
        {
          aggregateId,
          aggregateType,
          version: expectedVersion + events.length,
          lastModified: Timestamp.now(),
        },
        { merge: true }
      );

      await batch.commit();
    } catch (error) {
      if (error instanceof Error && error.message.includes('Concurrency conflict')) {
        throw error;
      }
      throw new Error(`Failed to save events: ${error}`);
    }
  }

  async getEvents(aggregateId: string, aggregateType: string): Promise<DomainEvent[]> {
    const snapshot = await this.firestore
      .collection(this.eventsCollection)
      .where('aggregateId', '==', aggregateId)
      .where('aggregateType', '==', aggregateType)
      .orderBy('version', 'asc')
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data() as FirestoreEventDocument;
      return {
        eventId: doc.id,
        eventType: data.eventType,
        aggregateId: data.aggregateId,
        aggregateType: data.aggregateType,
        occurredAt: data.timestamp.toDate(),
        data: data.data,
        metadata: data.metadata,
      };
    });
  }

  async getEventsFromVersion(
    aggregateId: string,
    aggregateType: string,
    fromVersion: number
  ): Promise<DomainEvent[]> {
    const snapshot = await this.firestore
      .collection(this.eventsCollection)
      .where('aggregateId', '==', aggregateId)
      .where('aggregateType', '==', aggregateType)
      .where('version', '>=', fromVersion)
      .orderBy('version', 'asc')
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data() as FirestoreEventDocument;
      return {
        eventId: doc.id,
        eventType: data.eventType,
        aggregateId: data.aggregateId,
        aggregateType: data.aggregateType,
        occurredAt: data.timestamp.toDate(),
        data: data.data,
        metadata: data.metadata,
      };
    });
  }

  async getCurrentVersion(aggregateId: string, aggregateType: string): Promise<number> {
    const aggregateRef = this.firestore
      .collection(this.aggregatesCollection)
      .doc(`${aggregateType}-${aggregateId}`);
    const doc = await aggregateRef.get();
    return doc.exists ? doc.data()?.version || 0 : 0;
  }

  async deleteAggregate(aggregateId: string, aggregateType: string): Promise<void> {
    const batch = this.firestore.batch();

    const eventsSnapshot = await this.firestore
      .collection(this.eventsCollection)
      .where('aggregateId', '==', aggregateId)
      .where('aggregateType', '==', aggregateType)
      .get();

    eventsSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    const aggregateRef = this.firestore
      .collection(this.aggregatesCollection)
      .doc(`${aggregateType}-${aggregateId}`);
    batch.delete(aggregateRef);

    await batch.commit();
  }
}
