/**
 * Digital Commerce Product Category Type (`commerce.products.product_type`)
 */
export const COMMERCE_PRODUCT_TYPE = {
  DIGITAL_FILE: 'digital_file',
  SERIAL_STOCK: 'serial_stock',
  SPECTER_RESOURCE: 'resource',
  WALLET_CREDIT: 'wallet_credit',
} as const;

export type CommerceProductType =
  (typeof COMMERCE_PRODUCT_TYPE)[keyof typeof COMMERCE_PRODUCT_TYPE];

export const COMMERCE_PRODUCT_TYPE_VALUES = Object.values(
  COMMERCE_PRODUCT_TYPE,
) as readonly CommerceProductType[];

/**
 * Digital Commerce Product Visibility (`commerce.products.visibility`)
 */
export const COMMERCE_PRODUCT_VISIBILITY = {
  HIDDEN: 'hidden',
  PUBLIC: 'public',
  TENANT_ONLY: 'tenant_only',
} as const;

export type CommerceProductVisibility =
  (typeof COMMERCE_PRODUCT_VISIBILITY)[keyof typeof COMMERCE_PRODUCT_VISIBILITY];

export const COMMERCE_PRODUCT_VISIBILITY_VALUES = Object.values(
  COMMERCE_PRODUCT_VISIBILITY,
) as readonly CommerceProductVisibility[];

/**
 * Product Variant Stock Tracking Mode (`commerce.product_variants.stock_mode`)
 */
export const COMMERCE_STOCK_MODE = {
  FINITE_COUNTER: 'finite_counter',
  SERIALIZED: 'serialized',
  UNLIMITED: 'unlimited',
} as const;

export type CommerceStockMode =
  (typeof COMMERCE_STOCK_MODE)[keyof typeof COMMERCE_STOCK_MODE];

export const COMMERCE_STOCK_MODE_VALUES = Object.values(
  COMMERCE_STOCK_MODE,
) as readonly CommerceStockMode[];

/**
 * Digital Commerce Order Lifecycle Status (`commerce.orders.status`)
 */
export const COMMERCE_ORDER_STATUS = {
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
  FAILED: 'failed',
  FULFILLING: 'fulfilling',
  MANUAL_REVIEW: 'manual_review',
  PAID: 'paid',
  PENDING_PAYMENT: 'pending_payment',
  REFUNDED: 'refunded',
} as const;

export type CommerceOrderStatus =
  (typeof COMMERCE_ORDER_STATUS)[keyof typeof COMMERCE_ORDER_STATUS];

export const COMMERCE_ORDER_STATUS_VALUES = Object.values(
  COMMERCE_ORDER_STATUS,
) as readonly CommerceOrderStatus[];

/**
 * Serial / Inventory Stock Item Status (`commerce.stock_items.status`)
 */
export const COMMERCE_STOCK_STATUS = {
  AVAILABLE: 'available',
  DEFECTIVE: 'defective',
  RESERVED: 'reserved',
  SOLD: 'sold',
} as const;

export type CommerceStockStatus =
  (typeof COMMERCE_STOCK_STATUS)[keyof typeof COMMERCE_STOCK_STATUS];

export const COMMERCE_STOCK_STATUS_VALUES = Object.values(
  COMMERCE_STOCK_STATUS,
) as readonly CommerceStockStatus[];
