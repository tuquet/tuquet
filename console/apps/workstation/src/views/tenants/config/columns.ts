import { TENANT_PLAN } from '#/constants';
import { $t } from '#/locales';

export interface PlanBadgeInfo {
  color: string;
  label: string;
}

export const TENANT_PLAN_CONFIG: Record<string, PlanBadgeInfo> = {
  [TENANT_PLAN.ENTERPRISE]: { color: 'purple', label: 'Enterprise' },
  [TENANT_PLAN.FREE]: { color: 'default', label: 'Free' },
  [TENANT_PLAN.PRO]: { color: 'geekblue', label: 'Pro' },
};

export function getTenantPlanBadge(plan?: string): PlanBadgeInfo {
  const key = plan?.toLowerCase() || TENANT_PLAN.PRO;
  return (
    TENANT_PLAN_CONFIG[key] || { color: 'default', label: plan || 'Standard' }
  );
}

export function getWorkspaceColumns() {
  return [
    {
      field: 'name',
      title: $t('page.workspace.col_name'),
      minWidth: 240,
      slots: { default: 'name-cell' },
    },
    {
      field: 'slug',
      title: $t('page.workspace.col_slug'),
      minWidth: 150,
      slots: { default: 'slug-cell' },
    },
    {
      field: 'plan',
      title: $t('page.workspace.col_plan'),
      minWidth: 120,
      slots: { default: 'plan-cell' },
    },
    {
      field: 'status',
      title: $t('page.workspace.col_status'),
      minWidth: 130,
      slots: { default: 'status-cell' },
    },
    {
      field: 'created_at',
      title: $t('page.workspace.col_created_at'),
      minWidth: 150,
      cellRender: { name: 'CellDate' },
    },
    {
      field: 'actions',
      title: $t('page.workspace.col_actions'),
      minWidth: 280,
      align: 'right' as const,
      showOverflow: false,
      slots: { default: 'actions-cell' },
    },
  ];
}
