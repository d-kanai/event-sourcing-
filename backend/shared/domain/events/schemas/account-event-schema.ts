import { z } from 'zod';
import { AccountEventType } from '../../../../modules/account/domain/events/account-event-type';

export const AccountCreatedDataSchema = z.object({
  accountId: z.string(),
  userId: z.string(),
  initialBalance: z.number().nonnegative(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'CLOSED'] as const),
  createdAt: z.string().datetime(),
});

export const MoneyDepositedDataSchema = z.object({
  accountId: z.string(),
  amount: z.number().positive(),
  depositedAt: z.string().datetime(),
});

export const MoneyWithdrawnDataSchema = z.object({
  accountId: z.string(),
  amount: z.number().positive(),
  withdrawnAt: z.string().datetime(),
});

const BaseAccountEventSchema = z.object({
  eventId: z.string(),
  aggregateId: z.string(),
  aggregateType: z.literal('Account'),
  occurredAt: z.string().datetime(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const AccountEventSchema = z.discriminatedUnion('eventType', [
  BaseAccountEventSchema.extend({
    eventType: z.literal(AccountEventType.ACCOUNT_CREATED),
    data: AccountCreatedDataSchema,
  }),
  BaseAccountEventSchema.extend({
    eventType: z.literal(AccountEventType.MONEY_DEPOSITED),
    data: MoneyDepositedDataSchema,
  }),
  BaseAccountEventSchema.extend({
    eventType: z.literal(AccountEventType.MONEY_WITHDRAWN),
    data: MoneyWithdrawnDataSchema,
  }),
]);

export const FirestoreAccountEventSchema = z.intersection(
  AccountEventSchema,
  z.object({
    processed: z.boolean(),
    createdAt: z.string().datetime(),
  })
);

export type AccountEventRecord = z.infer<typeof AccountEventSchema>;
export type FirestoreAccountEventRecord = z.infer<typeof FirestoreAccountEventSchema>;
