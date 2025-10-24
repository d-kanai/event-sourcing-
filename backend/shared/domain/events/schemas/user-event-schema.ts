import { z } from 'zod';
import { UserEventType } from '../../../../modules/user/domain/events/user-event-type';

export const UserCreatedDataSchema = z.object({
  userId: z.string(),
  email: z.string().email(),
  name: z.string().min(1),
  status: z.enum(['PENDING_VERIFICATION', 'VERIFIED'] as const),
  createdAt: z.string().datetime(),
});

export const UserVerifiedDataSchema = z.object({
  userId: z.string(),
  verifiedAt: z.string().datetime(),
});

const BaseUserEventSchema = z.object({
  eventId: z.string(),
  aggregateId: z.string(),
  aggregateType: z.literal('User'),
  occurredAt: z.string().datetime(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const UserEventSchema = z.discriminatedUnion('eventType', [
  BaseUserEventSchema.extend({
    eventType: z.literal(UserEventType.USER_CREATED),
    data: UserCreatedDataSchema,
  }),
  BaseUserEventSchema.extend({
    eventType: z.literal(UserEventType.USER_VERIFIED),
    data: UserVerifiedDataSchema,
  }),
]);

export const FirestoreUserEventSchema = z.intersection(
  UserEventSchema,
  z.object({
    processed: z.boolean(),
    createdAt: z.string().datetime(),
  })
);

export type UserEventRecord = z.infer<typeof UserEventSchema>;
export type FirestoreUserEventRecord = z.infer<typeof FirestoreUserEventSchema>;
