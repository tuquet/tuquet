import type { Component } from 'vue';

import type { SupabaseResourceKey } from '#/api/core/supabase-schema-registry';

export type VxeDetailSheetMode = 'create' | 'edit';

export interface VxeDetailSheetAction<T = Record<string, any>> {
  disabled?: (row: T) => boolean;
  handler?: (row: T) => any;
  icon?: Component;
  label: string;
  onClick?: (row: T) => any;
  variant?: 'default' | 'destructive' | 'ghost' | 'outline' | 'secondary';
}

export interface VxeDetailSheetOptions<T = Record<string, any>> {
  /**
   * Optional explicit slot name used by the grid's action column
   * (auto-detected from `actions-cell`, `action-cell`, `role-actions-cell`, `detail-cell` if omitted)
   */
  actionSlotName?: string;
  /**
   * Extra declarative action buttons to display inside the Detail Sheet footer
   */
  actions?: VxeDetailSheetAction<T>[];
  /**
   * Optional custom title when opened in Create Mode (`mode = 'create'`)
   */
  createTitle?: string;
  /**
   * Optional custom field options loader for relational selects (e.g. proxy_id, engine_version)
   */
  dynamicFieldOptions?: (params: {
    formData: Record<string, any>;
    mode: VxeDetailSheetMode;
    resource: SupabaseResourceKey;
    row?: T;
  }) => Promise<
    Record<string, Array<{ label: string; value: number | string }>>
  >;
  /**
   * Whether clicking a row opens the Detail Sheet (defaults to `true`)
   */
  enabled?: boolean;
  /**
   * Whether to forward the grid's action column slot into the sheet footer (defaults to `true`).
   * Set to `false` when the grid's action column only contains a "Detail" trigger button.
   */
  forwardActionSlot?: boolean;
  /**
   * Optional custom create handler overriding or augmenting the default PostgREST POST
   */
  onCreate?: (params: {
    formData: Record<string, any>;
    insertPayload: Record<string, any>;
    resource: SupabaseResourceKey;
  }) => any | Promise<any>;
  /**
   * Optional callback invoked after a new row is created via the Detail Sheet (`mode = 'create'`)
   */
  onCreated?: (row?: T) => any;
  /**
   * Optional custom save handler overriding or augmenting the default PostgREST PATCH
   */
  onSave?: (params: {
    dirtyPayload: Record<string, any>;
    formData: Record<string, any>;
    resource: SupabaseResourceKey;
    row: T;
  }) => Promise<void> | void;
  /**
   * Optional callback invoked after a row is saved via the Detail Sheet (`mode = 'edit'`)
   */
  onSaved?: (row?: T) => any;
  /**
   * Canonical Supabase table resource (`schema.table`).
   * Automatically inferred from route and row shape when omitted.
   */
  resource?: SupabaseResourceKey;
  /**
   * Optional field name from the row to display as subtitle metadata
   */
  subtitleField?: keyof T | string;
  /**
   * Optional field name from the row to display as primary sheet title
   */
  titleField?: keyof T | string;
}

/**
 * Checks whether a DOM click event originated inside an interactive element
 * (button, link, input, switch, or `[data-stop-row-click]`) so row-click
 * does not double-trigger when clicking inline action buttons.
 */
export function isInteractiveCellClick(event?: Event | null): boolean {
  if (!event) {
    return false;
  }
  const target = event.target as HTMLElement | null;
  if (!target || typeof target.closest !== 'function') {
    return false;
  }
  return Boolean(
    target.closest(
      'button, a, input, select, textarea, [role="button"], [role="switch"], [role="checkbox"], [data-stop-row-click], .vxe-checkbox--icon',
    ),
  );
}
