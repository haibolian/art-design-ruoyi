/**
 * 路由权限验证模块
 *
 * 提供路由权限过滤功能
 *
 * ## 主要功能
 *
 * - 判断指定路由是否可访问
 * - 过滤当前用户可访问的动态路由
 *
 * ## 使用场景
 *
 * - 路由守卫中过滤本地动态路由
 * - 注册隐藏业务页前的权限裁剪
 *
 * @module router/core/RouteAccessControl
 * @author Art Design Pro Team
 */

import type { AppRouteRecord } from '@/types/router'

/**
 * 路由权限验证器
 */
export class RouteAccessControl {
  /**
   * 判断当前用户是否具备指定路由的访问权限
   * 参考若依 dynamicRoutes 的 permissions / roles 规则
   */
  static hasRouteAccess(
    route: AppRouteRecord,
    permissions: string[] = [],
    roles: string[] = []
  ): boolean {
    if (permissions.includes('*:*:*') || permissions.includes('*')) {
      return true
    }

    if (route.permissions?.length) {
      return route.permissions.some((permission) => permissions.includes(permission))
    }

    if (route.meta?.roles?.length) {
      return route.meta.roles.some((role) => roles.includes(role))
    }

    return true
  }

  /**
   * 过滤当前用户可访问的动态路由
   */
  static filterRoutesByPermission(
    routes: AppRouteRecord[],
    permissions: string[] = [],
    roles: string[] = []
  ): AppRouteRecord[] {
    return routes.reduce<AppRouteRecord[]>((acc, route) => {
      if (!this.hasRouteAccess(route, permissions, roles)) {
        return acc
      }

      const currentRoute: AppRouteRecord = {
        ...route,
        meta: { ...(route.meta || {}) },
        children: route.children?.length
          ? this.filterRoutesByPermission(route.children, permissions, roles)
          : route.children
      }

      acc.push(currentRoute)
      return acc
    }, [])
  }
}
