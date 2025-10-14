import { PrismaClient } from '@prisma/client';
import { DomainEvent } from '../../domain/events/domain-event';
import { AggregateRoot } from '../../domain/entities/aggregate-root';
import { Projection } from './projection';

/**
 * Base class for Aggregate Projections
 *
 * Pattern: Replay aggregate from Event Store, then sync to read model
 *
 * This ensures:
 * - Calculation logic exists only in Rehydrator (Single Source of Truth)
 * - Projections are simple: "Copy aggregate state to RDB"
 * - Pure Event Sourcing: Events → Replay → Latest State → RDB
 *
 * Flow:
 * 1. Event occurs
 * 2. Replay aggregate from Event Store (get latest state)
 * 3. Update read model with aggregate's current state
 *
 * Usage:
 * ```typescript
 * export class MoneyDepositedProjection extends AggregateProjection<Account, AccountId> {
 *   eventType(): string {
 *     return AccountEventType.MONEY_DEPOSITED;
 *   }
 *
 *   protected extractAggregateId(event: DomainEvent): AccountId {
 *     return AccountId.create((event.data as any).accountId);
 *   }
 *
 *   protected async updateReadModel(account: Account): Promise<void> {
 *     await this.prisma.account.update({
 *       where: { id: account.id.getValue() },
 *       data: account.toJSON(),
 *     });
 *   }
 * }
 * ```
 */
export abstract class AggregateProjection<TAggregate extends AggregateRoot, TId> implements Projection {
  constructor(
    protected readonly prisma: PrismaClient,
    protected readonly replayById: (id: TId) => Promise<TAggregate | null>
  ) {}

  /**
   * Event type this projection handles
   * Must be implemented by subclass
   */
  abstract eventType(): string;

  /**
   * Project event to read model
   *
   * Steps:
   * 1. Extract aggregate ID from event
   * 2. Replay aggregate from Event Store (get latest state)
   * 3. Update read model with aggregate state
   */
  async project(event: DomainEvent): Promise<void> {
    // 1. Extract aggregate ID from event
    const aggregateId = this.extractAggregateId(event);

    // 2. Replay aggregate from Event Store to get latest state
    const aggregate = await this.replayById(aggregateId);

    if (!aggregate) {
      throw new Error(
        `Aggregate not found for projection: ${JSON.stringify(aggregateId)}`
      );
    }

    // 3. Update read model with aggregate's current state
    await this.updateReadModel(aggregate);
  }

  /**
   * Extract aggregate ID from event data
   * Must be implemented by subclass
   *
   * Example:
   * ```typescript
   * protected extractAggregateId(event: DomainEvent): AccountId {
   *   return AccountId.create((event.data as any).accountId);
   * }
   * ```
   */
  protected abstract extractAggregateId(event: DomainEvent): TId;

  /**
   * Update read model with aggregate's current state
   * Must be implemented by subclass
   *
   * Example:
   * ```typescript
   * protected async updateReadModel(account: Account): Promise<void> {
   *   await this.prisma.account.update({
   *     where: { id: account.id.getValue() },
   *     data: {
   *       balance: account.balance.getValue(),
   *       status: account.status.getValue(),
   *     },
   *   });
   * }
   * ```
   */
  protected abstract updateReadModel(aggregate: TAggregate): Promise<void>;
}
