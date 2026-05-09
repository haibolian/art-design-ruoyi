import request from '@/utils/http'

// 查询菜单列表
export function fetchGetMenuList(params?: Api.SystemManage.MenuQueryParams) {
  return request.get<Api.SystemManage.MenuListItem[]>({
    url: '/system/menu/list',
    params
  })
}

// 查询菜单详细
export function fetchGetMenuDetail(menuId: number) {
  return request.get<Api.SystemManage.MenuListItem>({
    url: `/system/menu/${menuId}`
  })
}

// 新增菜单
export function fetchAddMenu(data: Api.SystemManage.MenuPayload) {
  return request.post<void>({
    url: '/system/menu',
    params: data
  })
}

// 修改菜单
export function fetchUpdateMenu(data: Api.SystemManage.MenuPayload) {
  return request.put<void>({
    url: '/system/menu',
    params: data
  })
}

// 保存菜单排序
export function fetchUpdateMenuSort(data: Api.SystemManage.MenuSortPayload) {
  return request.put<void>({
    url: '/system/menu/updateSort',
    params: data
  })
}

// 删除菜单
export function fetchDeleteMenu(menuId: number) {
  return request.del<void>({
    url: `/system/menu/${menuId}`
  })
}
