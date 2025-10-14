/**
 * Shared Snapshot Infrastructure
 *
 * Provides generic snapshot repository implementations
 * for performance optimization in event sourcing
 *
 * Implementations:
 * - InMemorySnapshotRepository: For testing
 * - EventStoreSnapshotRepository: For production (EventStoreDB)
 */

export { InMemorySnapshotRepository } from './in-memory-snapshot-repository';
export { EventStoreSnapshotRepository } from './eventstore-snapshot-repository';
