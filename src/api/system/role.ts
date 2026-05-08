import request from '@/utils/http'
import { toFormUrlEncoded } from '@/utils/http/form'

const normalizeId = (id: number | string | undefined | null) =>
  id === undefined || id === null ? '' : id
const joinIds = (ids: number | number[]) => (Array.isArray(ids) ? ids.join(',') : ids)

// 查询角色列表
export function fetchGetRoleList(params: Api.SystemManage.RoleSearchParams) {
  return request.get<Api.SystemManage.RoleList>({
    url: '/system/role/list',
    params
  })
}

// 查询角色详细
export function fetchGetRoleDetail(roleId: number | string) {
  return request.get<Api.SystemManage.RoleListItem>({
    url: `/system/role/${normalizeId(roleId)}`
  })
}

// 新增角色
export function fetchAddRole(data: Api.SystemManage.RolePayload) {
  return request.post<void>({
    url: '/system/role',
    params: data
  })
}

// 修改角色
export function fetchUpdateRole(data: Api.SystemManage.RolePayload) {
  return request.put<void>({
    url: '/system/role',
    params: data
  })
}

// 删除角色
export function fetchDeleteRole(roleId: number | number[]) {
  return request.del<void>({
    url: `/system/role/${joinIds(roleId)}`
  })
}

// 角色状态修改
export function fetchChangeRoleStatus(roleId: number, status: '0' | '1') {
  return request.put<void>({
    url: '/system/role/changeStatus',
    params: { roleId, status }
  })
}

// 角色数据权限修改
export function fetchUpdateRoleDataScope(data: Api.SystemManage.RolePayload) {
  return request.put<void>({
    url: '/system/role/dataScope',
    params: data
  })
}

// 查询部门树结构
export function fetchGetRoleDeptTree(roleId: number | string) {
  return request.get<Api.SystemManage.RoleDeptTreeResponse>({
    url: `/system/role/deptTree/${normalizeId(roleId)}`
  })
}

// 查询菜单下拉树结构
export function fetchGetMenuTree() {
  return request.get<Api.SystemManage.TreeSelectNode[]>({
    url: '/system/menu/treeselect'
  })
}

// 根据角色查询菜单树结构
export function fetchGetRoleMenuTree(roleId: number | string) {
  return request.get<Api.SystemManage.RoleMenuTreeResponse>({
    url: `/system/menu/roleMenuTreeselect/${normalizeId(roleId)}`
  })
}

// 查询已分配用户列表
export function fetchGetAllocatedUserList(params: Api.SystemManage.RoleAuthUserSearchParams) {
  return request.get<Api.SystemManage.UserList>({
    url: '/system/role/authUser/allocatedList',
    params
  })
}

// 查询未分配用户列表
export function fetchGetUnallocatedUserList(params: Api.SystemManage.RoleAuthUserSearchParams) {
  return request.get<Api.SystemManage.UserList>({
    url: '/system/role/authUser/unallocatedList',
    params
  })
}

// 取消用户角色授权
export function fetchCancelAuthUser(data: Api.SystemManage.RoleAuthUserPayload) {
  return request.put<void>({
    url: '/system/role/authUser/cancel',
    params: data
  })
}

// 批量取消用户角色授权
export function fetchCancelAuthUserAll(params: Api.SystemManage.RoleAuthUserPayload) {
  return request.put<void>({
    url: '/system/role/authUser/cancelAll',
    params
  })
}

// 批量选择授权用户
export function fetchSelectAuthUserAll(params: Api.SystemManage.RoleAuthUserPayload) {
  return request.put<void>({
    url: '/system/role/authUser/selectAll',
    params
  })
}

// 角色导出
export function fetchExportRole(params: Api.SystemManage.RoleSearchParams) {
  return request.post<Blob>({
    url: '/system/role/export',
    data: toFormUrlEncoded(params),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    responseType: 'blob'
  })
}
