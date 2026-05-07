import request from '@/utils/http'

// 查询部门列表
export function fetchGetDeptList(params?: Api.SystemManage.DeptQueryParams) {
  return request.get<Api.SystemManage.DeptListItem[]>({
    url: '/system/dept/list',
    params
  })
}

// 查询部门列表（排除指定节点及其子节点）
export function fetchGetDeptListExcludeChild(deptId: number) {
  return request.get<Api.SystemManage.DeptListItem[]>({
    url: `/system/dept/list/exclude/${deptId}`
  })
}

// 查询部门详细
export function fetchGetDeptDetail(deptId: number) {
  return request.get<Api.SystemManage.DeptListItem>({
    url: `/system/dept/${deptId}`
  })
}

// 新增部门
export function fetchAddDept(data: Api.SystemManage.DeptPayload) {
  return request.post<void>({
    url: '/system/dept',
    params: data
  })
}

// 修改部门
export function fetchUpdateDept(data: Api.SystemManage.DeptPayload) {
  return request.put<void>({
    url: '/system/dept',
    params: data
  })
}

// 删除部门
export function fetchDeleteDept(deptId: number) {
  return request.del<void>({
    url: `/system/dept/${deptId}`
  })
}

// 保存部门排序
export function fetchUpdateDeptSort(data: Api.SystemManage.DeptSortPayload) {
  return request.put<void>({
    url: '/system/dept/updateSort',
    params: data
  })
}
