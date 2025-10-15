import { PrismaClient } from '@prisma/client';
import { DomainEvent } from '../../domain/events/domain-event';
import { AggregateRoot } from '../../domain/entities/aggregate-root';
import { Projection } from './projection';

export abstract class AggregateProjection<TAggregate extends AggregateRoot, TId> implements Projection {
  constructor(
    protected readonly prisma: PrismaClient,
    protected readonly replayById: (id: TId) => Promise<TAggregate | null>
  ) {}

  abstract eventType(): string;

  async project(event: DomainEvent): Promise<void> {
    const aggregateId = this.extractAggregateId(event);

    const aggregate = await this.replayById(aggregateId);

    if (!aggregate) {
      throw new Error(
        `Aggregate not found for projection: ${JSON.stringify(aggregateId)}`
      );
    }

    await this.updateReadModel(aggregate);
  }

  protected abstract extractAggregateId(event: DomainEvent): TId;

  protected abstract updateReadModel(aggregate: TAggregate): Promise<void>;
}
