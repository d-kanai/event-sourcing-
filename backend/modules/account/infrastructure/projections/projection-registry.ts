import { DomainEvent } from '../../domain/events/domain-event';
import { Projection } from './projection';

/**
 * Registry that manages multiple projections and routes events to appropriate handlers
 */
export class ProjectionRegistry {
  private projections: Map<string, Projection> = new Map();

  register(projection: Projection): void {
    this.projections.set(projection.eventType(), projection);
  }

  async project(event: DomainEvent): Promise<void> {
    const projection = this.projections.get(event.eventType);

    if (!projection) {
      // Ignore unknown event types - allows for flexible event evolution
      return;
    }

    await projection.project(event);
  }

  getRegisteredEventTypes(): string[] {
    return Array.from(this.projections.keys());
  }
}
