import request from '@/utils/http'

const joinIds = (ids: number | number[]) => (Array.isArray(ids) ? ids.join(',') : ids)

// 查询公告列表
export function fetchGetNoticeList(params: Api.SystemManage.NoticeSearchParams) {
  return request.get<Api.SystemManage.NoticeList>({
    url: '/system/notice/list',
    params
  })
}

// 查询公告详细
export function fetchGetNoticeDetail(noticeId: number) {
  return request.get<Api.SystemManage.NoticeListItem>({
    url: `/system/notice/${noticeId}`
  })
}

// 新增公告
export function fetchAddNotice(data: Api.SystemManage.NoticePayload) {
  return request.post<void>({
    url: '/system/notice',
    params: data
  })
}

// 修改公告
export function fetchUpdateNotice(data: Api.SystemManage.NoticePayload) {
  return request.put<void>({
    url: '/system/notice',
    params: data
  })
}

// 删除公告
export function fetchDeleteNotice(noticeId: number | number[]) {
  return request.del<void>({
    url: `/system/notice/${joinIds(noticeId)}`
  })
}

// 首页顶部公告列表（带已读状态）
export function fetchGetNoticeTopList() {
  return request.get<Api.SystemManage.NoticeListItem[]>({
    url: '/system/notice/listTop'
  })
}

// 标记公告已读
export function fetchMarkNoticeRead(noticeId: number) {
  return request.post<void>({
    url: '/system/notice/markRead',
    params: { noticeId }
  })
}

// 批量标记公告已读
export function fetchMarkNoticeReadAll(ids: string) {
  return request.post<void>({
    url: '/system/notice/markReadAll',
    params: { ids }
  })
}

// 查询公告已读用户列表
export function fetchGetNoticeReadUsers(params: Api.SystemManage.NoticeReadUserSearchParams) {
  return request.get<Api.SystemManage.NoticeReadUserList>({
    url: '/system/notice/readUsers/list',
    params
  })
}
