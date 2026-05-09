import type { AppRouteRecord } from '@/types/router'

/**
 * 后端路由模式下的本地隐藏业务路由
 * 参考若依 dynamicRoutes：不依赖 getRouters 返回，由前端按 permissions 补充注册
 */
export const asyncRoutes: AppRouteRecord[] = [
  {
    path: '/system/role-auth',
    name: 'SystemRoleAuth',
    component: '/index/index',
    hidden: true,
    permissions: ['system:role:edit'],
    meta: {
      title: '角色分配用户',
      isHide: true
    },
    children: [
      {
        path: 'user/:roleId',
        name: 'RoleAuthUser',
        component: '/system/role/auth-user',
        meta: {
          title: '角色分配用户',
          activePath: '/system/role',
          isHide: true,
          isHideTab: true,
          keepAlive: true
        }
      }
    ]
  },
  {
    path: '/system/dict-data',
    name: 'SystemDictData',
    component: '/index/index',
    hidden: true,
    permissions: ['system:dict:list'],
    meta: {
      title: 'menus.system.dictData',
      isHide: true
    },
    children: [
      {
        path: ':dictId',
        name: 'DictData',
        component: '/system/dict/data',
        meta: {
          title: 'menus.system.dictData',
          activePath: '/system/dict',
          isHide: true,
          keepAlive: true
        }
      }
    ]
  },
  {
    path: '/monitor/job-log',
    name: 'MonitorJobLog',
    component: '/index/index',
    hidden: true,
    permissions: ['monitor:job:list'],
    meta: {
      title: 'menus.monitor.jobLog',
      isHide: true
    },
    children: [
      {
        path: ':jobId?',
        name: 'JobLog',
        component: '/monitor/job/log',
        meta: {
          title: 'menus.monitor.jobLog',
          activePath: '/monitor/job',
          isHide: true,
          keepAlive: true
        }
      }
    ]
  }
]
