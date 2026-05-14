import request from '@/utils/http'

// 查询缓存详细
export function fetchGetCache() {
  return request.get<Api.Monitor.CacheInfo>({
    url: '/monitor/cache'
  })
}

// 查询缓存名称列表
export function fetchListCacheName() {
  return request.get<Api.Monitor.SysCache[]>({
    url: '/monitor/cache/getNames'
  })
}

// 查询缓存键名列表
export function fetchListCacheKey(cacheName: string) {
  return request.get<string[]>({
    url: `/monitor/cache/getKeys/${cacheName}`
  })
}

// 查询缓存内容
export function fetchGetCacheValue(cacheName: string, cacheKey: string) {
  return request.get<Api.Monitor.SysCache>({
    url: `/monitor/cache/getValue/${cacheName}/${cacheKey}`
  })
}

// 清理指定名称缓存
export function fetchClearCacheName(cacheName: string) {
  return request.del<void>({
    url: `/monitor/cache/clearCacheName/${cacheName}`
  })
}

// 清理指定键名缓存
export function fetchClearCacheKey(cacheKey: string) {
  return request.del<void>({
    url: `/monitor/cache/clearCacheKey/${cacheKey}`
  })
}

// 清理全部缓存
export function fetchClearCacheAll() {
  return request.del<void>({
    url: '/monitor/cache/clearCacheAll'
  })
}
