import { DomainEvent } from '../../domain/events/domain-event';

export interface Projection {
  eventType(): string;

  project(event: DomainEvent): Promise<void>;
}
