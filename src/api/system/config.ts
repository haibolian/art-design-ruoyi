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

// 查询参数列表
export function fetchGetConfigList(params: Api.SystemManage.ConfigSearchParams) {
  return request.get<Api.SystemManage.ConfigList>({
    url: '/system/config/list',
    params
  })
}

// 查询参数详细
export function fetchGetConfigDetail(configId: number) {
  return request.get<Api.SystemManage.ConfigListItem>({
    url: `/system/config/${configId}`
  })
}

// 根据参数键名查询参数值
export function fetchGetConfigKey(configKey: string) {
  return request.get<string>({
    url: `/system/config/configKey/${encodeURIComponent(configKey)}`
  })
}

// 新增参数配置
export function fetchAddConfig(data: Api.SystemManage.ConfigPayload) {
  return request.post<void>({
    url: '/system/config',
    params: data
  })
}

// 修改参数配置
export function fetchUpdateConfig(data: Api.SystemManage.ConfigPayload) {
  return request.put<void>({
    url: '/system/config',
    params: data
  })
}

// 删除参数配置
export function fetchDeleteConfig(configId: number | number[]) {
  return request.del<void>({
    url: `/system/config/${joinIds(configId)}`
  })
}

// 刷新参数缓存
export function fetchRefreshConfigCache() {
  return request.del<void>({
    url: '/system/config/refreshCache'
  })
}

// 导出参数配置
export function fetchExportConfig(params: Api.SystemManage.ConfigSearchParams) {
  return request.post<Blob>({
    url: '/system/config/export',
    data: toFormUrlEncoded(params),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    responseType: 'blob'
  })
}
