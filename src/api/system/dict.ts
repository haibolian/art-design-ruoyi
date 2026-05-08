import request from '@/utils/http'
import { toFormUrlEncoded } from '@/utils/http/form'
import type { DictDataItem, DictType } from '@/types'

const joinIds = (ids: number | number[]) => (Array.isArray(ids) ? ids.join(',') : ids)

/**
 * 根据字典类型获取字典数据
 */
export function fetchGetDictDataByType(dictType: DictType) {
  const type = String(dictType || '').trim()
  if (!type) {
    throw new Error('[DictAPI] dictType 不能为空')
  }

  return request.get<DictDataItem[]>({
    url: `/system/dict/data/type/${encodeURIComponent(type)}`
  })
}

// 查询字典类型列表
export function fetchGetDictTypeList(params: Api.SystemManage.DictTypeSearchParams) {
  return request.get<Api.SystemManage.DictTypeList>({
    url: '/system/dict/type/list',
    params
  })
}

// 查询字典类型详细
export function fetchGetDictTypeDetail(dictId: number) {
  return request.get<Api.SystemManage.DictTypeListItem>({
    url: `/system/dict/type/${dictId}`
  })
}

// 新增字典类型
export function fetchAddDictType(data: Api.SystemManage.DictTypePayload) {
  return request.post<void>({
    url: '/system/dict/type',
    params: data
  })
}

// 修改字典类型
export function fetchUpdateDictType(data: Api.SystemManage.DictTypePayload) {
  return request.put<void>({
    url: '/system/dict/type',
    params: data
  })
}

// 删除字典类型
export function fetchDeleteDictType(dictId: number | number[]) {
  return request.del<void>({
    url: `/system/dict/type/${joinIds(dictId)}`
  })
}

// 刷新字典缓存
export function fetchRefreshDictCache() {
  return request.del<void>({
    url: '/system/dict/type/refreshCache'
  })
}

// 查询字典类型下拉选项
export function fetchGetDictTypeOptions() {
  return request.get<Api.SystemManage.DictTypeListItem[]>({
    url: '/system/dict/type/optionselect'
  })
}

// 导出字典类型
export function fetchExportDictType(params: Api.SystemManage.DictTypeSearchParams) {
  return request.post<Blob>({
    url: '/system/dict/type/export',
    data: toFormUrlEncoded(params),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    responseType: 'blob'
  })
}

// 查询字典数据列表
export function fetchGetDictDataList(params: Api.SystemManage.DictDataSearchParams) {
  return request.get<Api.SystemManage.DictDataList>({
    url: '/system/dict/data/list',
    params
  })
}

// 查询字典数据详细
export function fetchGetDictDataDetail(dictCode: number) {
  return request.get<Api.SystemManage.DictDataListItem>({
    url: `/system/dict/data/${dictCode}`
  })
}

// 新增字典数据
export function fetchAddDictData(data: Api.SystemManage.DictDataPayload) {
  return request.post<void>({
    url: '/system/dict/data',
    params: data
  })
}

// 修改字典数据
export function fetchUpdateDictData(data: Api.SystemManage.DictDataPayload) {
  return request.put<void>({
    url: '/system/dict/data',
    params: data
  })
}

// 删除字典数据
export function fetchDeleteDictData(dictCode: number | number[]) {
  return request.del<void>({
    url: `/system/dict/data/${joinIds(dictCode)}`
  })
}

// 导出字典数据
export function fetchExportDictData(params: Api.SystemManage.DictDataSearchParams) {
  return request.post<Blob>({
    url: '/system/dict/data/export',
    data: toFormUrlEncoded(params),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    responseType: 'blob'
  })
}
