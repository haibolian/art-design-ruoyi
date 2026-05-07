<template>
  <ElDialog
    :model-value="visible"
    title="选择用户"
    width="920px"
    top="5vh"
    destroy-on-close
    @update:model-value="handleVisibleChange"
    @closed="handleClosed"
  >
    <ProTable ref="proTableRef" :request="requestUserList" :columns="columns" :toolbar="false" />

    <template #footer>
      <ElButton @click="handleCancel">取消</ElButton>
      <ElButton type="primary" :loading="submitLoading" @click="handleSubmit">确定</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { DICT_TYPE } from '@/types'
  import type { ProTableColumn, ProTableExpose } from '@/types/component'
  import { fetchGetUnallocatedUserList, fetchSelectAuthUserAll } from '@/api/system/role'

  interface Props {
    visible: boolean
    roleId?: number | null
  }

  interface Emits {
    (e: 'update:visible', value: boolean): void
    (e: 'success'): void
  }

  type UserListItem = Api.SystemManage.UserListItem

  const props = withDefaults(defineProps<Props>(), {
    visible: false,
    roleId: null
  })
  const emit = defineEmits<Emits>()

  const proTableRef = ref<ProTableExpose<UserListItem> | null>(null)
  const submitLoading = ref(false)

  const columns: ProTableColumn<UserListItem, Api.SystemManage.RoleAuthUserSearchParams>[] = [
    { type: 'selection' },
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
      prop: 'email',
      label: '邮箱',
      minWidth: 180,
      formatter: (row) => row.email || row.userEmail || '-'
    },
    {
      prop: 'phonenumber',
      label: '手机号码',
      minWidth: 140,
      search: {
        props: {
          placeholder: '请输入手机号码',
          maxlength: 11
        }
      },
      formatter: (row) => row.phonenumber || row.userPhone || '-'
    },
    {
      prop: 'status',
      label: '状态',
      width: 110,
      dictType: DICT_TYPE.NORMAL_DISABLE,
      valueType: 'dict-tag'
    },
    {
      prop: 'createTime',
      label: '创建时间',
      minWidth: 170,
      formatter: (row) => row.createTime || '-'
    }
  ]

  const requestUserList = (params: Api.SystemManage.RoleAuthUserSearchParams) => {
    if (typeof props.roleId !== 'number') {
      return Promise.resolve({
        rows: [],
        total: 0,
        pageNum: params.pageNum || 1,
        pageSize: params.pageSize || 10
      } as Api.SystemManage.UserList)
    }

    return fetchGetUnallocatedUserList({
      ...params,
      roleId: props.roleId
    })
  }

  const getSelectedUserIds = () => {
    const selectedRows = proTableRef.value?.selectedRows as
      | UserListItem[]
      | { value: UserListItem[] }
      | undefined
    const rows = Array.isArray(selectedRows) ? selectedRows : selectedRows?.value || []
    return rows.map((item) => item.userId).filter((id): id is number => typeof id === 'number')
  }

  const handleSubmit = async () => {
    if (typeof props.roleId !== 'number') {
      throw new Error('分配用户时缺少 roleId')
    }

    const userIds = getSelectedUserIds()
    if (userIds.length === 0) {
      ElMessage.warning('请选择要分配的用户')
      return
    }

    submitLoading.value = true
    try {
      await fetchSelectAuthUserAll({
        roleId: props.roleId,
        userIds: userIds.join(',')
      })
      ElMessage.success('分配成功')
      emit('success')
      emit('update:visible', false)
    } finally {
      submitLoading.value = false
    }
  }

  const handleCancel = () => {
    emit('update:visible', false)
  }

  const handleVisibleChange = (value: boolean) => {
    emit('update:visible', value)
  }

  const handleClosed = () => {
    proTableRef.value?.clearSelection()
  }

  watch(
    () => props.visible,
    async (visible) => {
      if (!visible || typeof props.roleId !== 'number') return
      await nextTick()
      await proTableRef.value?.resetSearch()
    }
  )
</script>
