import { DomainEvent } from '../../domain/events/domain-event';

/**
 * Projection Interface
 *
 * Projections transform events into read-optimized models (CQRS Read side)
 *
 * Each projection handles a specific event type and updates the read model accordingly.
 * Examples:
 * - MoneyDepositedProjection: Updates account balance in read DB
 * - AccountCreatedProjection: Creates account record in read DB
 * - OrderShippedProjection: Updates order status in read DB
 *
 * Design principles:
 * - One projection per event type (single responsibility)
 * - Projections are idempotent (can be replayed safely)
 * - Projections are eventually consistent (async from events)
 */
export interface Projection {
  /**
   * Returns the event type this projection handles
   * Used by ProjectionRegistry for event routing
   */
  eventType(): string;

  /**
   * Projects the event to the read model
   * Should be idempotent - same event can be applied multiple times
   *
   * @param event - Domain event to project
   */
  project(event: DomainEvent): Promise<void>;
}
