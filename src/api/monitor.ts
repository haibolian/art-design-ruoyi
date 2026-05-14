import request from '@/utils/http'

const joinIds = (ids: number | number[]) => (Array.isArray(ids) ? ids.join(',') : ids)

// 登录日志
export function fetchGetLogininforList(params: Api.Monitor.LogininforSearchParams) {
  return request.get<Api.Monitor.LogininforList>({
    url: '/monitor/logininfor/list',
    params
  })
}

export function fetchDeleteLogininfor(infoId: number | number[]) {
  return request.del<void>({
    url: `/monitor/logininfor/${joinIds(infoId)}`
  })
}

export function fetchCleanLogininfor() {
  return request.del<void>({
    url: '/monitor/logininfor/clean'
  })
}

export function fetchUnlockLogininfor(userName: string) {
  return request.get<void>({
    url: `/monitor/logininfor/unlock/${userName}`
  })
}

// 操作日志
export function fetchGetOperlogList(params: Api.Monitor.OperlogSearchParams) {
  return request.get<Api.Monitor.OperlogList>({
    url: '/monitor/operlog/list',
    params
  })
}

export function fetchDeleteOperlog(operId: number | number[]) {
  return request.del<void>({
    url: `/monitor/operlog/${joinIds(operId)}`
  })
}

export function fetchCleanOperlog() {
  return request.del<void>({
    url: '/monitor/operlog/clean'
  })
}

// 在线用户
export function fetchGetOnlineList(params: Api.Monitor.OnlineSearchParams) {
  return request.get<Api.Monitor.OnlineList>({
    url: '/monitor/online/list',
    params
  })
}

export function fetchForceLogout(tokenId: string) {
  return request.del<void>({
    url: `/monitor/online/${tokenId}`
  })
}

// 服务器监控
export function fetchGetServer() {
  return request.get<Api.Monitor.ServerInfo>({
    url: '/monitor/server'
  })
}
