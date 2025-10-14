import { DomainEvent } from '../../domain/events/domain-event';
import { Projection } from './projection';

/**
 * Projection Registry
 *
 * Central registry that manages multiple projections and routes events to appropriate handlers
 *
 * Responsibilities:
 * - Register projections for specific event types
 * - Route incoming events to the correct projection
 * - Gracefully handle unknown event types (allows event evolution)
 *
 * Usage:
 * ```typescript
 * const registry = new ProjectionRegistry();
 * registry.register(new AccountCreatedProjection(prisma));
 * registry.register(new MoneyDepositedProjection(prisma));
 *
 * // Events are automatically routed to the correct projection
 * await registry.project(accountCreatedEvent); // -> AccountCreatedProjection
 * await registry.project(moneyDepositedEvent); // -> MoneyDepositedProjection
 * ```
 *
 * Event Evolution:
 * If an event type has no registered projection, it's silently ignored.
 * This allows old events to exist without breaking the system.
 */
export class ProjectionRegistry {
  private projections: Map<string, Projection> = new Map();

  /**
   * Register a projection for a specific event type
   * If a projection for this event type already exists, it will be replaced
   */
  register(projection: Projection): void {
    this.projections.set(projection.eventType(), projection);
  }

  /**
   * Project an event to the read model
   * Routes the event to the appropriate projection based on event type
   *
   * @param event - Domain event to project
   */
  async project(event: DomainEvent): Promise<void> {
    const projection = this.projections.get(event.eventType);

    if (!projection) {
      // Ignore unknown event types - allows for flexible event evolution
      // Old events can still exist in the event store without breaking new code
      return;
    }

    await projection.project(event);
  }

  /**
   * Get all registered event types (for debugging/monitoring)
   */
  getRegisteredEventTypes(): string[] {
    return Array.from(this.projections.keys());
  }

  /**
   * Check if a projection is registered for an event type
   */
  hasProjection(eventType: string): boolean {
    return this.projections.has(eventType);
  }

  /**
   * Unregister a projection (useful for testing)
   */
  unregister(eventType: string): void {
    this.projections.delete(eventType);
  }

  /**
   * Clear all projections (useful for testing)
   */
  clear(): void {
    this.projections.clear();
  }
}
