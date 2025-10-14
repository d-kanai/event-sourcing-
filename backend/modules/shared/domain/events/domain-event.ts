export interface DomainEvent {
  eventId: string;
  eventType: string;
  aggregateId: string;
  aggregateType: string;
  occurredAt: Date;
  data: unknown;
  metadata?: Record<string, unknown>;
}

export abstract class BaseDomainEvent implements DomainEvent {
  public readonly eventId: string;
  public readonly occurredAt: Date;
  public readonly aggregateType = 'Account';

  constructor(
    public readonly eventType: string,
    public readonly aggregateId: string,
    public readonly data: unknown,
    public readonly metadata?: Record<string, unknown>
  ) {
    this.eventId = crypto.randomUUID();
    this.occurredAt = new Date();
  }
}
