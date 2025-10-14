/**
 * Shared Event Store Infrastructure
 *
 * This module provides common event sourcing infrastructure
 * that can be reused across all aggregates (Account, Order, etc.)
 */

// Base repository and interfaces
export {
  BaseEventSourcedRepository,
  EventStore,
  Snapshot,
  SnapshotRepository,
  ProjectionRegistry,
  RehydratorStatic,
} from './base-event-sourced-repository';

// EventStore implementations
export { EventStoreClient } from './event-store-client';
export { InMemoryEventStore } from './in-memory-event-store';
