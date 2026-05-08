<template>
  <ElDialog
    v-model="visible"
    :title="noticeTitle ? `「${noticeTitle}」已读用户` : '阅读用户'"
    width="960px"
    top="5vh"
    destroy-on-close
    @closed="handleClosed"
  >
    <ProTable ref="proTableRef" :request="requestReadUsers" :columns="columns" :toolbar="false" />
  </ElDialog>
</template>

<script setup lang="ts">
  import type { ProTableColumn, ProTableExpose } from '@/types/component'
  import { fetchGetNoticeReadUsers } from '@/api/system/notice'

  type NoticeReadUserItem = Api.SystemManage.NoticeReadUserItem
  type NoticeReadUserSearchParams = Api.SystemManage.NoticeReadUserSearchParams
  type NoticeListItem = Api.SystemManage.NoticeListItem

  const visible = ref(false)
  const noticeId = ref<number>()
  const noticeTitle = ref('')
  const proTableRef = ref<ProTableExpose<NoticeReadUserItem> | null>(null)

  const columns: ProTableColumn<NoticeReadUserItem, NoticeReadUserSearchParams>[] = [
    { type: 'index', width: 60, label: '序号' },
    {
      prop: 'userName',
      label: '用户名称',
      minWidth: 140,
      search: {
        props: {
          placeholder: '请输入用户名称'
        }
      },
      formatter: (row) => row.userName || '-'
    },
    {
      prop: 'nickName',
      label: '用户昵称',
      minWidth: 140,
      formatter: (row) => row.nickName || '-'
    },
    {
      prop: 'deptName',
      label: '部门',
      minWidth: 160,
      formatter: (row) => row.deptName || '-'
    },
    {
      prop: 'phonenumber',
      label: '手机号码',
      minWidth: 140,
      formatter: (row) => row.phonenumber || '-'
    },
    {
      prop: 'readTime',
      label: '阅读时间',
      minWidth: 170,
      formatter: (row) => row.readTime || '-'
    }
  ]

  const requestReadUsers = (params: NoticeReadUserSearchParams) => {
    if (typeof noticeId.value !== 'number') {
      return Promise.resolve({
        rows: [],
        total: 0,
        pageNum: params.pageNum || 1,
        pageSize: params.pageSize || 10
      } as Api.SystemManage.NoticeReadUserList)
    }

    return fetchGetNoticeReadUsers({
      ...params,
      noticeId: noticeId.value
    })
  }

  const open = async (row: NoticeListItem) => {
    if (typeof row.noticeId !== 'number') {
      throw new Error('查看阅读用户时缺少 noticeId')
    }

    noticeId.value = row.noticeId
    noticeTitle.value = row.noticeTitle || ''
    visible.value = true
    await nextTick()
    await proTableRef.value?.resetSearch()
  }

  const handleClosed = () => {
    noticeId.value = undefined
    noticeTitle.value = ''
  }

  defineExpose({
    open
  })
</script>
