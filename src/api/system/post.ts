import request from '@/utils/http'

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

// 查询岗位列表
export function fetchGetPostList(params: Api.SystemManage.PostSearchParams) {
  return request.get<Api.SystemManage.PostList>({
    url: '/system/post/list',
    params
  })
}

// 查询岗位详细
export function fetchGetPostDetail(postId: number) {
  return request.get<Api.SystemManage.PostListItem>({
    url: `/system/post/${postId}`
  })
}

// 新增岗位
export function fetchAddPost(data: Api.SystemManage.PostPayload) {
  return request.post<void>({
    url: '/system/post',
    params: data
  })
}

// 修改岗位
export function fetchUpdatePost(data: Api.SystemManage.PostPayload) {
  return request.put<void>({
    url: '/system/post',
    params: data
  })
}

// 删除岗位
export function fetchDeletePost(postId: number | number[]) {
  return request.del<void>({
    url: `/system/post/${joinIds(postId)}`
  })
}

// 导出岗位
export function fetchExportPost(params: Api.SystemManage.PostSearchParams) {
  return request.post<Blob>({
    url: '/system/post/export',
    data: toFormUrlEncoded(params),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    responseType: 'blob'
  })
}
