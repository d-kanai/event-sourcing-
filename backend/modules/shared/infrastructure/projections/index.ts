/**
 * Shared Projection Infrastructure
 *
 * Provides common projection functionality for CQRS read side
 * Can be reused across all aggregates (Account, Order, etc.)
 */

export { Projection } from './projection';
export { ProjectionRegistry } from './projection-registry';
export { AggregateProjection } from './aggregate-projection';
