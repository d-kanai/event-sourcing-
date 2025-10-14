/**
 * Enum for all account-related event types
 * Ensures type safety and prevents typos in event type names
 */
export enum EventType {
  ACCOUNT_CREATED = 'AccountCreated',
  MONEY_DEPOSITED = 'MoneyDeposited',
  MONEY_WITHDRAWN = 'MoneyWithdrawn',
  ACCOUNT_SUSPENDED = 'AccountSuspended',
  ACCOUNT_ACTIVATED = 'AccountActivated',
  ACCOUNT_CLOSED = 'AccountClosed',
}
