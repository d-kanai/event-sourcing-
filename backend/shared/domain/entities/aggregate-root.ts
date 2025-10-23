import { DomainEvent } from '../events/domain-event';

export abstract class AggregateRoot {
  private uncommittedEvents: DomainEvent[] = [];

  addEvent(event: DomainEvent): void {
    this.uncommittedEvents.push(event);
  }

  getUncommittedEvents(): DomainEvent[] {
    return [...this.uncommittedEvents];
  }

  clearUncommittedEvents(): void {
    this.uncommittedEvents = [];
  }
}
