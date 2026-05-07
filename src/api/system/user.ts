import request from '@/utils/http'

const normalizeId = (id: number | string | undefined | null) =>
  id === undefined || id === null ? '' : id
const joinIds = (ids: number | number[]) => (Array.isArray(ids) ? ids.join(',') : ids)
const toFormUrlEncoded = (params: Record<string, any>) => {
  const data = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return

    if (key === 'params' && typeof value === 'object' && !Array.isArray(value)) {
      Object.entries(value).forEach(([paramKey, paramValue]) => {
        if (paramValue === undefined || paramValue === null || paramValue === '') return
        data.append(`params[${paramKey}]`, String(paramValue))
      })
      return
    }

    data.append(key, String(value))
  })

  return data
}

// 查询用户列表
export function fetchGetUserList(params: Api.SystemManage.UserSearchParams) {
  return request.get<Api.SystemManage.UserList>({
    url: '/system/user/list',
    params
  })
}

// 查询用户详细；不传 userId 时返回新增表单所需角色/岗位
export function fetchGetUserDetail(userId?: number | string | null) {
  return request.get<Api.SystemManage.UserDetailResponse>({
    url: `/system/user/${normalizeId(userId)}`,
    returnRawResponse: true
  })
}

// 新增用户
export function fetchAddUser(data: Api.SystemManage.UserPayload) {
  return request.post<void>({
    url: '/system/user',
    params: data
  })
}

// 修改用户
export function fetchUpdateUser(data: Api.SystemManage.UserPayload) {
  return request.put<void>({
    url: '/system/user',
    params: data
  })
}

// 删除用户
export function fetchDeleteUser(userId: number | number[]) {
  return request.del<void>({
    url: `/system/user/${joinIds(userId)}`
  })
}

// 用户状态修改
export function fetchChangeUserStatus(userId: number, status: '0' | '1') {
  return request.put<void>({
    url: '/system/user/changeStatus',
    params: { userId, status }
  })
}

// 用户密码重置
export function fetchResetUserPwd(userId: number, password: string) {
  return request.put<void>({
    url: '/system/user/resetPwd',
    params: { userId, password }
  })
}

// 查询部门下拉树结构
export function fetchGetDeptTree() {
  return request.get<Api.SystemManage.TreeSelectNode[]>({
    url: '/system/user/deptTree'
  })
}

// 查询用户个人信息
export function fetchGetUserProfile() {
  return request.get<Api.SystemManage.UserProfileResponse>({
    url: '/system/user/profile',
    returnRawResponse: true
  })
}

// 修改用户个人信息
export function fetchUpdateUserProfile(data: Api.SystemManage.UserPayload) {
  return request.put<void>({
    url: '/system/user/profile',
    params: data
  })
}

// 修改当前用户密码
export function fetchUpdateUserPwd(oldPassword: string, newPassword: string) {
  return request.put<void>({
    url: '/system/user/profile/updatePwd',
    params: { oldPassword, newPassword }
  })
}

// 上传用户头像
export function fetchUploadAvatar(data: FormData) {
  return request.post<{ imgUrl?: string }>({
    url: '/system/user/profile/avatar',
    data,
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

// 用户导入
export function fetchImportUser(data: FormData) {
  return request.post<Api.SystemManage.UserImportResult>({
    url: '/system/user/importData',
    data,
    headers: { 'Content-Type': 'multipart/form-data' },
    returnRawResponse: true
  })
}

// 用户导入模板
export function fetchDownloadUserImportTemplate() {
  return request.post<Blob>({
    url: '/system/user/importTemplate',
    data: toFormUrlEncoded({}),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    responseType: 'blob'
  })
}

// 用户导出
export function fetchExportUser(params: Api.SystemManage.UserSearchParams) {
  return request.post<Blob>({
    url: '/system/user/export',
    data: toFormUrlEncoded(params),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    responseType: 'blob'
  })
}

// 查询参数键值；用户新增默认密码使用 sys.user.initPassword
export function fetchGetConfigKey(configKey: string) {
  return request.get<string>({
    url: `/system/config/configKey/${encodeURIComponent(configKey)}`
  })
}
