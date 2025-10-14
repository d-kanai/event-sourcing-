import { DomainEvent } from '../events/domain-event';

/**
 * Base class for all Aggregate Roots in the domain
 * Provides common event management functionality for Event Sourcing
 *
 * Key responsibilities:
 * - Track uncommitted domain events
 * - Provide methods to add, retrieve, and clear events
 * - Enforce aggregate pattern for event-sourced entities
 */
export abstract class AggregateRoot {
  private uncommittedEvents: DomainEvent[] = [];

  /**
   * Add domain event to uncommitted events list
   * Called by aggregate methods when state changes occur
   * Also accessible by factories for creation events
   *
   * @param event - Domain event to add
   */
  addEvent(event: DomainEvent): void {
    this.uncommittedEvents.push(event);
  }

  /**
   * Get all uncommitted events for this aggregate
   * Used by repository to persist events to event store
   *
   * @returns Copy of uncommitted events array
   */
  getUncommittedEvents(): DomainEvent[] {
    return [...this.uncommittedEvents];
  }

  /**
   * Clear all uncommitted events
   * Called by repository after successfully persisting events
   */
  clearUncommittedEvents(): void {
    this.uncommittedEvents = [];
  }
}
