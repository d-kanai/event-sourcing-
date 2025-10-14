import { DomainEvent } from '../../../shared/domain/events/domain-event';

/**
 * Base interface for all projections
 */
export interface Projection {
  /**
   * Returns the event type this projection handles
   */
  eventType(): string;

  /**
   * Projects the event to the read model
   */
  project(event: DomainEvent): Promise<void>;
}
