import { DomainEvent } from '../../domain/events/domain-event';
import { Projection } from './projection';

export class ProjectionRegistry {
  private projections: Map<string, Projection> = new Map();

  register(projection: Projection): void {
    this.projections.set(projection.eventType(), projection);
  }

  async project(event: DomainEvent): Promise<void> {
    const projection = this.projections.get(event.eventType);

    if (!projection) {
      return;
    }

    await projection.project(event);
  }

  getRegisteredEventTypes(): string[] {
    return Array.from(this.projections.keys());
  }

  hasProjection(eventType: string): boolean {
    return this.projections.has(eventType);
  }

  unregister(eventType: string): void {
    this.projections.delete(eventType);
  }

  clear(): void {
    this.projections.clear();
  }
}
