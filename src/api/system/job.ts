import request from '@/utils/http'
import { toFormUrlEncoded } from '@/utils/http/form'

const joinIds = (ids: number | number[]) => (Array.isArray(ids) ? ids.join(',') : ids)

// 查询定时任务列表
export function fetchGetJobList(params: Api.Monitor.JobSearchParams) {
  return request.get<Api.Monitor.JobList>({
    url: '/monitor/job/list',
    params
  })
}

// 查询定时任务详细
export function fetchGetJobDetail(jobId: number) {
  return request.get<Api.Monitor.JobListItem>({
    url: `/monitor/job/${jobId}`
  })
}

// 新增定时任务
export function fetchAddJob(data: Api.Monitor.JobPayload) {
  return request.post<void>({
    url: '/monitor/job',
    params: data
  })
}

// 修改定时任务
export function fetchUpdateJob(data: Api.Monitor.JobPayload) {
  return request.put<void>({
    url: '/monitor/job',
    params: data
  })
}

// 删除定时任务
export function fetchDeleteJob(jobId: number | number[]) {
  return request.del<void>({
    url: `/monitor/job/${joinIds(jobId)}`
  })
}

// 修改任务状态
export function fetchChangeJobStatus(jobId: number, status: '0' | '1') {
  return request.put<void>({
    url: '/monitor/job/changeStatus',
    params: { jobId, status }
  })
}

// 立即执行一次
export function fetchRunJob(jobId: number, jobGroup: string) {
  return request.put<void>({
    url: '/monitor/job/run',
    params: { jobId, jobGroup }
  })
}

// 导出定时任务
export function fetchExportJob(params: Api.Monitor.JobSearchParams) {
  return request.post<Blob>({
    url: '/monitor/job/export',
    data: toFormUrlEncoded(params),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    responseType: 'blob'
  })
}

// 查询调度日志列表
export function fetchGetJobLogList(params: Api.Monitor.JobLogSearchParams) {
  return request.get<Api.Monitor.JobLogList>({
    url: '/monitor/jobLog/list',
    params
  })
}

// 删除调度日志
export function fetchDeleteJobLog(jobLogId: number | number[]) {
  return request.del<void>({
    url: `/monitor/jobLog/${joinIds(jobLogId)}`
  })
}

// 清空调度日志
export function fetchCleanJobLog() {
  return request.del<void>({
    url: '/monitor/jobLog/clean'
  })
}

// 导出调度日志
export function fetchExportJobLog(params: Api.Monitor.JobLogSearchParams) {
  return request.post<Blob>({
    url: '/monitor/jobLog/export',
    data: toFormUrlEncoded(params),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    responseType: 'blob'
  })
}
