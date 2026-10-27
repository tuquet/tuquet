import type { VxeTablePropTypes } from 'vxe-table';

import type { Ref } from 'vue';

/**
 * Custom storage adapter interface
 * Supports arbitrary backends (API, IndexedDB wrapper, third-party libraries, etc.)
 */
export interface ViewedRowStorageAdapter {
  /** Read list of all viewed keys */
  getKeys(): Promise<Array<number | string>>;

  /** Remove all viewed data */
  removeKeys(): Promise<void>;

  /** Persist list of viewed keys */
  setKeys(keys: Array<number | string>): Promise<void>;
}

/**
 * Viewed row persistence — common base fields
 */
interface ViewedRowPersistBase {
  /** Time-to-live for persisted data (milliseconds) */
  ttl?: number;
  /** Max cache capacity; evicts oldest marked key (FIFO) when exceeded (default: 100) */
  maxSize?: number;
}

/**
 * Viewed row persistence configuration (discriminated union by type)
 *
 * - 'memory'          → In-memory only, no persistence
 * - 'localStorage'    → Persist in localStorage; key is required
 * - 'sessionStorage'  → Persist in sessionStorage; key is required
 * - 'indexedDB'       → Persist in IndexedDB per entry; key is required
 * - 'custom'          → User-defined adapter; storage is required
 */
export type ViewedRowPersistOptions =
  | (ViewedRowPersistBase & {
      /** Custom storage adapter (required) */
      storage: ViewedRowStorageAdapter;
      type: 'custom';
    })
  | (ViewedRowPersistBase & {
      /** IndexedDB database name, default 'viewed-table-db' */
      dbName?: string;
      /** IndexedDB database version, default 1 */
      dbVersion?: number;
      /** Storage key / prefix (required) */
      key: string;
      /** IndexedDB object store name, default 'viewed-table-row' */
      storeName?: string;
      type: 'indexedDB';
    })
  | (ViewedRowPersistBase & {
      /** Storage key (required) */
      key: string;
      type: 'localStorage' | 'sessionStorage';
    })
  | (ViewedRowPersistBase & {
      type: 'memory';
    });

/**
 * Viewed row settings
 */
export interface ViewedRowOptions<T = any> {
  /** Mark row as viewed when clicking matching code in CellOperation */
  actionCodes?: string | string[];
  /** Row unique identifier field; defaults to gridOptions.rowConfig.keyField, falls back to 'id' */
  keyField?: string;
  /** List of viewed row keys */
  viewedKeys?: Array<number | string> | Ref<Array<number | string>>;
  /**
   * Persistence configuration
   * - string: Uses built-in localStorage with value as storage key (backwards compatible)
   * - object: Advanced configuration
   * - omitted: No persistence (equivalent to memory)
   */
  persist?: string | ViewedRowPersistOptions;
  rowClassName?: VxeTablePropTypes.RowClassName<T>;
  rowStyle?: VxeTablePropTypes.RowStyle<T>;
}
