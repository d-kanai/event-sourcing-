/**
 * Account Event Types
 *
 * Enum for all account-related event types
 * Ensures type safety and prevents typos in event type names
 *
 * Event naming convention: PastTense (what happened)
 * - AccountCreated (not CreateAccount)
 * - MoneyDeposited (not DepositMoney)
 * - MoneyWithdrawn (not WithdrawMoney)
 *
 * These strings are persisted in EventStoreDB, so:
 * - Never change existing values (would break event replay)
 * - Only add new event types
 * - Use versioning if schema changes (AccountCreatedV2, etc.)
 */
export enum AccountEventType {
  ACCOUNT_CREATED = 'AccountCreated',
  MONEY_DEPOSITED = 'MoneyDeposited',
  MONEY_WITHDRAWN = 'MoneyWithdrawn',
}
