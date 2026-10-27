import type { RouteRecordRaw } from 'vue-router';

/**
 * Filter route tree by checking meta.plugin against installed system plugins.
 * - If a route requires a plugin (route.meta.plugin) that is not in `installedPlugins`, it is omitted.
 * - Children are filtered recursively.
 * - If a parent route has no own component and all its children were filtered out, it is pruned.
 *
 * @param routes - List of RouteRecordRaw objects
 * @param installedPlugins - Array of plugin IDs that are currently installed (e.g. ['core-iam', 'workers'])
 */
export function filterRoutesByPlugins(
  routes: RouteRecordRaw[],
  installedPlugins: string[],
): RouteRecordRaw[] {
  if (!Array.isArray(routes) || routes.length === 0) {
    return [];
  }

  const result: RouteRecordRaw[] = [];

  for (const route of routes) {
    const requiredPlugin = (
      route.meta as undefined | { plugin?: string | string[] }
    )?.plugin;
    if (requiredPlugin) {
      const isInstalled = Array.isArray(requiredPlugin)
        ? requiredPlugin.some((p) => installedPlugins.includes(p))
        : installedPlugins.includes(requiredPlugin);
      if (!isInstalled) {
        continue;
      }
    }

    const cloned = { ...route };
    if (Array.isArray(cloned.children) && cloned.children.length > 0) {
      cloned.children = filterRoutesByPlugins(
        cloned.children,
        installedPlugins,
      );
      if (cloned.children.length === 0 && !cloned.component) {
        // Layout parent with all children filtered out -> prune
        continue;
      }
    }

    result.push(cloned);
  }

  return result;
}
