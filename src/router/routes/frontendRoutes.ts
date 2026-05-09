// 权限文档：https://www.artd.pro/docs/zh/guide/in-depth/permission.html
import { AppRouteRecord } from '@/types/router'
import { routeModules } from '../modules'

/**
 * 前端路由模式使用的完整业务路由
 * 用于渲染菜单，并在前端权限模式下按角色过滤
 */
export const frontendRoutes: AppRouteRecord[] = routeModules
