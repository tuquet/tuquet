/**
 * Payment Gateway Channel Type (`billing.payment_intents.channel`)
 */
export const PAYMENT_CHANNEL = {
  BANK_TRANSFER: 'bank_transfer',
  CARD_INTL: 'card_intl',
  CRYPTO: 'crypto',
  E_WALLET: 'e_wallet',
  INTERNAL_WALLET: 'internal_wallet',
} as const;

export type PaymentChannelType =
  (typeof PAYMENT_CHANNEL)[keyof typeof PAYMENT_CHANNEL];

export const PAYMENT_CHANNEL_VALUES = Object.values(
  PAYMENT_CHANNEL,
) as readonly PaymentChannelType[];

/**
 * Payment Intent Lifecycle Status (`billing.payment_intents.status`)
 */
export const PAYMENT_INTENT_STATUS = {
  EXPIRED: 'expired',
  FAILED: 'failed',
  MANUAL_REVIEW: 'manual_review',
  PENDING: 'pending',
  PROCESSING: 'processing',
  REFUNDED: 'refunded',
  SUCCEEDED: 'succeeded',
} as const;

export type PaymentIntentStatusType =
  (typeof PAYMENT_INTENT_STATUS)[keyof typeof PAYMENT_INTENT_STATUS];

export const PAYMENT_INTENT_STATUS_VALUES = Object.values(
  PAYMENT_INTENT_STATUS,
) as readonly PaymentIntentStatusType[];

/**
 * Payment Intent Target Resource Type (`billing.payment_intents.target_type`)
 */
export const PAYMENT_TARGET_TYPE = {
  COMMERCE_ORDER: 'commerce_order',
  SUBSCRIPTION_UPGRADE: 'subscription_upgrade',
  WALLET_TOPUP: 'wallet_topup',
} as const;

export type PaymentTargetType =
  (typeof PAYMENT_TARGET_TYPE)[keyof typeof PAYMENT_TARGET_TYPE];

export const PAYMENT_TARGET_TYPE_VALUES = Object.values(
  PAYMENT_TARGET_TYPE,
) as readonly PaymentTargetType[];

/**
 * Tenant Coin Wallet Ledger Transaction Type (`billing.wallet_transactions.tx_type`)
 */
export const WALLET_TX_TYPE = {
  ADMIN_ADJUSTMENT: 'admin_adjustment',
  BONUS: 'bonus',
  PURCHASE: 'purchase',
  REFUND: 'refund',
  TOPUP: 'topup',
} as const;

export type WalletTxType = (typeof WALLET_TX_TYPE)[keyof typeof WALLET_TX_TYPE];

export const WALLET_TX_TYPE_VALUES = Object.values(
  WALLET_TX_TYPE,
) as readonly WalletTxType[];

/**
 * Platform Workspace Subscription Status (`billing.subscriptions.status`)
 */
export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  CANCELED: 'canceled',
  FREE_TIER: 'free_tier',
  PAST_DUE: 'past_due',
  TRIALING: 'trialing',
  UNPAID: 'unpaid',
} as const;

export type SubscriptionStatus =
  (typeof SUBSCRIPTION_STATUS)[keyof typeof SUBSCRIPTION_STATUS];

export const SUBSCRIPTION_STATUS_VALUES = Object.values(
  SUBSCRIPTION_STATUS,
) as readonly SubscriptionStatus[];
