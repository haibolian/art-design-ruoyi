/**
 * 路由验证器
 *
 * 负责验证路由配置的合法性
 *
 * @module router/core/RouteValidator
 * @author Art Design Pro Team
 */

import type { AppRouteRecord } from '@/types/router'
import { RoutesAlias } from '../routesAlias'

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

export class RouteValidator {
  /**
   * 验证路由配置
   */
  validate(routes: AppRouteRecord[]): ValidationResult {
    const errors: string[] = []

    this.checkComponents(routes, errors)
    this.checkLayoutUsage(routes, errors)

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * 检测组件配置
   */
  private checkComponents(
    routes: AppRouteRecord[],
    errors: string[],
    parentPath = ''
  ): void {
    routes.forEach((route) => {
      const hasExternalLink = !!route.meta?.link?.trim()
      const hasChildren = Array.isArray(route.children) && route.children.length > 0
      const routePath = route.path || '[未定义路径]'
      const isIframe = route.meta?.isIframe

      // 如果配置了 component，则无需校验
      if (route.component) {
        if (route.children?.length) {
          const fullPath = this.resolvePath(parentPath, route.path || '')
          this.checkComponents(route.children, errors, fullPath)
        }
        return
      }

      // 一级菜单：必须指定 Layout，除非是外链或 iframe
      if (parentPath === '' && !hasExternalLink && !isIframe) {
        errors.push(`一级菜单(${routePath}) 缺少 component，必须指向 ${RoutesAlias.Layout}`)
        return
      }

      // 非一级菜单：如果既不是外链、iframe，也没有子路由，则必须配置 component
      if (!hasExternalLink && !isIframe && !hasChildren) {
        errors.push(`路由(${routePath}) 缺少 component 配置`)
      }

      // 递归检查子路由
      if (route.children?.length) {
        const fullPath = this.resolvePath(parentPath, route.path || '')
        this.checkComponents(route.children, errors, fullPath)
      }
    })
  }

  /**
   * 检测嵌套菜单的 Layout 组件配置
   * 只有一级菜单才能使用 Layout，二级及以下菜单不能使用
   */
  private checkLayoutUsage(routes: AppRouteRecord[], errors: string[], level = 1): void {
    routes.forEach((route) => {
      if (level > 1 && (route.component === RoutesAlias.Layout || route.component === 'Layout')) {
        const routeName = String(route.name || route.path || '未知路由')
        const routePath = route.path || '/'
        errors.push(`${level}级菜单(${routeName}, ${routePath}) 不能使用 ${RoutesAlias.Layout}`)
      }

      if (route.children?.length) {
        this.checkLayoutUsage(route.children, errors, level + 1)
      }
    })
  }

  /**
   * 路径解析
   */
  private resolvePath(parent: string, child: string): string {
    return [parent.replace(/\/$/, ''), child.replace(/^\//, '')].filter(Boolean).join('/')
  }
}
