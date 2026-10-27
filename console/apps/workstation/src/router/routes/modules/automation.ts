import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:workflow',
      order: 20,
      title: $t('page.automation.title'),
    },
    name: 'Automation',
    path: '/automation',
    redirect: '/automation/browsers',
    children: [
      {
        name: 'AutomationOverview',
        path: 'overview',
        component: () => import('#/views/automation/overview/index.vue'),
        meta: {
          authority: [
            'superadmin',
            'automation:workflows:read',
            'automation:jobs:read',
            'workers:devices:read',
            'workers:browsers:read',
            'workers:proxies:read',
          ],
          icon: 'lucide:activity',
          plugin: ['automation', 'workers'],
          title: $t('page.automation.overview'),
        },
      },
      {
        name: 'AutomationWorkflows',
        path: 'workflows',
        component: () => import('#/views/automation/workflows/index.vue'),
        meta: {
          authority: ['superadmin', 'automation:workflows:read'],
          icon: 'lucide:git-branch',
          plugin: 'automation',
          title: $t('page.automation.workflows'),
        },
      },
      {
        name: 'AutomationJobs',
        path: 'jobs',
        component: () => import('#/views/automation/jobs/index.vue'),
        meta: {
          authority: ['superadmin', 'automation:jobs:read'],
          icon: 'lucide:play-circle',
          plugin: 'automation',
          title: $t('page.automation.jobs'),
        },
      },
      {
        name: 'AutomationDevices',
        path: 'devices',
        component: () => import('#/views/automation/devices/index.vue'),
        meta: {
          authority: ['superadmin', 'workers:devices:read'],
          icon: 'lucide:laptop',
          plugin: 'workers',
          title: $t('page.automation.devices'),
        },
      },
      {
        name: 'AutomationBrowsers',
        path: 'browsers',
        component: () => import('#/views/automation/browsers/index.vue'),
        meta: {
          authority: ['superadmin', 'workers:browsers:read'],
          icon: 'lucide:globe',
          plugin: 'workers',
          title: $t('page.automation.browsers'),
        },
      },
      {
        name: 'AutomationProxies',
        path: 'proxies',
        component: () => import('#/views/automation/proxies/index.vue'),
        meta: {
          authority: ['superadmin', 'workers:proxies:read'],
          icon: 'lucide:network',
          plugin: 'workers',
          title: $t('page.automation.proxies'),
        },
      },
      {
        name: 'AutomationJobDetail',
        path: 'jobs/:id',
        component: () => import('#/views/automation/jobs/detail.vue'),
        meta: {
          authority: ['superadmin', 'automation:jobs:read'],
          hideInMenu: true,
          icon: 'lucide:file-text',
          plugin: 'automation',
          title: $t('page.automation.jobDetail'),
        },
      },
    ],
  },
];

export default routes;
