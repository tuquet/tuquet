import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      authority: ['superadmin', 'tenants:read'],
      hideChildrenInMenu: true,
      icon: 'lucide:building-2',
      order: 10,
      plugin: 'core-iam',
      title: $t('page.tenants.title'),
    },
    name: 'TenantsRoot',
    path: '/tenants',
    redirect: '/tenants',
    children: [
      {
        name: 'Tenants',
        path: '',
        component: () => import('#/views/tenants/index.vue'),
        meta: {
          authority: ['superadmin', 'tenants:read'],
          icon: 'lucide:building-2',
          title: $t('page.tenants.title'),
        },
      },
      {
        name: 'TenantDetail',
        path: ':id',
        component: () => import('#/views/tenants/detail.vue'),
        meta: {
          authority: ['superadmin', 'tenants:read'],
          hideInMenu: true,
          icon: 'lucide:layout-grid',
          title: $t('page.tenants.detail'),
        },
      },
    ],
  },
];

export default routes;
