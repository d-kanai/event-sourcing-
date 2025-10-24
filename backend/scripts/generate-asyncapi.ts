import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { UserEventType } from '../modules/user/domain/events/user-event-type';
import { AccountEventType } from '../modules/account/domain/events/account-event-type';

const userStatuses = ['PENDING_VERIFICATION', 'VERIFIED'] as const;
const accountStatuses = ['ACTIVE', 'SUSPENDED', 'CLOSED'] as const;

const userCreatedDataSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['userId', 'email', 'name', 'status', 'createdAt'],
  properties: {
    userId: { type: 'string', description: 'User identifier' },
    email: { type: 'string', format: 'email' },
    name: { type: 'string' },
    status: { type: 'string', enum: [...userStatuses] },
    createdAt: { type: 'string', format: 'date-time' },
  },
};

const userVerifiedDataSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['userId', 'verifiedAt'],
  properties: {
    userId: { type: 'string' },
    verifiedAt: { type: 'string', format: 'date-time' },
  },
};

const baseEventProperties = {
  eventId: { type: 'string', description: 'Event identifier (UUID)' },
  eventType: { type: 'string' },
  aggregateId: { type: 'string' },
  aggregateType: { type: 'string' },
  occurredAt: { type: 'string', format: 'date-time' },
  metadata: {
    type: 'object',
    additionalProperties: true,
  },
};

const userEventSchema = {
  oneOf: [
    {
      type: 'object',
      additionalProperties: false,
      required: ['eventId', 'eventType', 'aggregateId', 'aggregateType', 'occurredAt', 'data'],
      properties: {
        ...baseEventProperties,
        eventType: { type: 'string', enum: [UserEventType.USER_CREATED] },
        aggregateType: { type: 'string', const: 'User' },
        data: userCreatedDataSchema,
      },
    },
    {
      type: 'object',
      additionalProperties: false,
      required: ['eventId', 'eventType', 'aggregateId', 'aggregateType', 'occurredAt', 'data'],
      properties: {
        ...baseEventProperties,
        eventType: { type: 'string', enum: [UserEventType.USER_VERIFIED] },
        aggregateType: { type: 'string', const: 'User' },
        data: userVerifiedDataSchema,
      },
    },
  ],
};

const accountCreatedDataSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['accountId', 'userId', 'initialBalance', 'status', 'createdAt'],
  properties: {
    accountId: { type: 'string' },
    userId: { type: 'string' },
    initialBalance: { type: 'number', minimum: 0 },
    status: { type: 'string', enum: [...accountStatuses] },
    createdAt: { type: 'string', format: 'date-time' },
  },
};

const moneyTransferDataSchema = (timestampField: string) => ({
  type: 'object',
  additionalProperties: false,
  required: ['accountId', 'amount', timestampField],
  properties: {
    accountId: { type: 'string' },
    amount: { type: 'number', exclusiveMinimum: 0 },
    [timestampField]: { type: 'string', format: 'date-time' },
  },
});

const accountEventSchema = {
  oneOf: [
    {
      type: 'object',
      additionalProperties: false,
      required: ['eventId', 'eventType', 'aggregateId', 'aggregateType', 'occurredAt', 'data'],
      properties: {
        ...baseEventProperties,
        eventType: { type: 'string', enum: [AccountEventType.ACCOUNT_CREATED] },
        aggregateType: { type: 'string', const: 'Account' },
        data: accountCreatedDataSchema,
      },
    },
    {
      type: 'object',
      additionalProperties: false,
      required: ['eventId', 'eventType', 'aggregateId', 'aggregateType', 'occurredAt', 'data'],
      properties: {
        ...baseEventProperties,
        eventType: { type: 'string', enum: [AccountEventType.MONEY_DEPOSITED] },
        aggregateType: { type: 'string', const: 'Account' },
        data: moneyTransferDataSchema('depositedAt'),
      },
    },
    {
      type: 'object',
      additionalProperties: false,
      required: ['eventId', 'eventType', 'aggregateId', 'aggregateType', 'occurredAt', 'data'],
      properties: {
        ...baseEventProperties,
        eventType: { type: 'string', enum: [AccountEventType.MONEY_WITHDRAWN] },
        aggregateType: { type: 'string', const: 'Account' },
        data: moneyTransferDataSchema('withdrawnAt'),
      },
    },
  ],
};

const asyncApiDocument = {
  asyncapi: '2.6.0',
  info: {
    title: 'User ↔ Account Event Contract',
    version: '1.0.0',
    description:
      'Asynchronous contract between the User Service (producer) and Account Service (consumer).',
  },
  defaultContentType: 'application/json',
  servers: {
    firestore: {
      url: 'firestore://{projectId}/events',
      protocol: 'firestore',
      description: 'Firestore events collection used as an event queue.',
      variables: {
        projectId: {
          description: 'Firebase project identifier',
          default: 'event-sourcing-local',
        },
      },
    },
  },
  channels: {
    'firestore.events': {
      description:
        'Events persisted by the User Service and consumed by the Account Service via Firestore.',
      bindings: {
        firestore: {
          collection: 'events',
        },
      },
      publish: {
        summary: 'User Service publishes user aggregate events.',
        operationId: 'publishUserEvent',
        message: {
          $ref: '#/components/messages/UserEventMessage',
        },
      },
      subscribe: {
        summary: 'Account Service consumes user events to provision bank accounts.',
        operationId: 'consumeUserEvent',
        message: {
          $ref: '#/components/messages/UserEventMessage',
        },
      },
    },
  },
  components: {
    messages: {
      UserEventMessage: {
        name: 'UserEvent',
        title: 'User domain event',
        summary: 'Envelope describing domain events emitted by the User Service.',
        payload: {
          $ref: '#/components/schemas/UserEvent',
        },
      },
    },
    schemas: {
      UserEvent: userEventSchema,
      AccountEvent: accountEventSchema,
      UserCreatedData: userCreatedDataSchema,
      UserVerifiedData: userVerifiedDataSchema,
      AccountCreatedData: accountCreatedDataSchema,
    },
  },
};

const outputPath = resolve(__dirname, '../asyncapi/user-account.json');
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, JSON.stringify(asyncApiDocument, null, 2));

console.log(`AsyncAPI document generated at ${outputPath}`);
