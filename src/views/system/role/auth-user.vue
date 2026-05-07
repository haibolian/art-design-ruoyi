<template>
  <div class="art-full-height">
    <ProTable ref="proTableRef" :request="requestUserList" :columns="columns">
      <template #toolbar-left="{ selectedRows }">
        <ElSpace wrap>
          <ElButton v-auth="'system:role:edit'" @click="selectDialogVisible = true" v-ripple>
            添加用户
          </ElButton>
          <ElButton
            v-auth="'system:role:edit'"
            :disabled="selectedRows.length === 0"
            @click="cancelAuthUserAll()"
            v-ripple
          >
            批量取消授权
          </ElButton>
          <ElButton @click="router.push({ name: 'Role' })" v-ripple>关闭</ElButton>
        </ElSpace>
      </template>
    </ProTable>

    <RoleAuthUserSelectDialog
      v-model:visible="selectDialogVisible"
      :role-id="roleId"
      @success="handleSelectSuccess"
    />
  </div>
</template>

<script setup lang="ts">
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import { DICT_TYPE } from '@/types'
  import type { ProTableColumn, ProTableExpose } from '@/types/component'
  import {
    fetchCancelAuthUser,
    fetchCancelAuthUserAll,
    fetchGetAllocatedUserList
  } from '@/api/system/role'
  import RoleAuthUserSelectDialog from './modules/role-auth-user-select-dialog.vue'

  defineOptions({ name: 'RoleAuthUser' })

  type UserListItem = Api.SystemManage.UserListItem

  const route = useRoute()
  const router = useRouter()
  const proTableRef = ref<ProTableExpose<UserListItem> | null>(null)
  const roleId = ref<number | null>(null)
  const selectDialogVisible = ref(false)

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
    },
    {
      prop: 'operation',
      label: '操作',
      width: 100,
      fixed: 'right',
      cellRender: (row) =>
        h(ArtButtonTable, {
          icon: 'ri:user-unfollow-line',
          iconClass: 'bg-error/12 text-error',
          onClick: () => cancelAuthUser(row)
        })
    }
  ]

  const requestUserList = (params: Api.SystemManage.RoleAuthUserSearchParams) => {
    if (typeof roleId.value !== 'number') {
      return Promise.resolve({
        rows: [],
        total: 0,
        pageNum: params.pageNum || 1,
        pageSize: params.pageSize || 10
      } as Api.SystemManage.UserList)
    }

    return fetchGetAllocatedUserList({
      ...params,
      roleId: roleId.value
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

  const cancelAuthUser = async (row: UserListItem) => {
    if (typeof roleId.value !== 'number' || typeof row.userId !== 'number') return

    try {
      await ElMessageBox.confirm(`确认取消用户 "${row.userName}" 的角色授权吗？`, '取消授权', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      await fetchCancelAuthUser({
        roleId: roleId.value,
        userId: row.userId
      })
      ElMessage.success('取消授权成功')
      await proTableRef.value?.refreshRemove()
    } catch (error) {
      if (error === 'cancel' || error === 'close') return
      throw error
    }
  }

  const cancelAuthUserAll = async () => {
    if (typeof roleId.value !== 'number') return

    const userIds = getSelectedUserIds()
    if (userIds.length === 0) {
      ElMessage.warning('请先选择需要取消授权的用户')
      return
    }

    try {
      await ElMessageBox.confirm('确认取消选中用户的角色授权吗？', '批量取消授权', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      await fetchCancelAuthUserAll({
        roleId: roleId.value,
        userIds: userIds.join(',')
      })
      ElMessage.success('取消授权成功')
      await proTableRef.value?.refreshRemove()
    } catch (error) {
      if (error === 'cancel' || error === 'close') return
      throw error
    }
  }

  const handleSelectSuccess = async () => {
    selectDialogVisible.value = false
    await proTableRef.value?.refreshData()
  }

  const parseRoleId = (value: unknown) => {
    const nextRoleId = Number(value)
    if (!Number.isInteger(nextRoleId) || nextRoleId <= 0) {
      return null
    }
    return nextRoleId
  }

  const syncRouteRole = async (mode: 'init' | 'update' = 'update') => {
    if (route.name !== 'RoleAuthUser') {
      return
    }

    const nextRoleId = parseRoleId(route.params.roleId)
    if (nextRoleId === null) {
      roleId.value = null
      ElMessage.error('角色参数无效')
      await router.replace({ name: 'Role' })
      return
    }

    const changed = roleId.value !== nextRoleId
    roleId.value = nextRoleId

    await nextTick()
    if (mode === 'init' || changed) {
      await proTableRef.value?.resetSearch()
      return
    }

    await proTableRef.value?.getData()
  }

  onMounted(async () => {
    await syncRouteRole('init')
  })

  watch(
    () => [route.name, route.params.roleId],
    async ([name], [prevName, prevRoleId]) => {
      if (name !== 'RoleAuthUser') {
        return
      }

      const mode =
        prevName !== 'RoleAuthUser' || prevRoleId !== route.params.roleId ? 'init' : 'update'
      await syncRouteRole(mode)
    }
  )
</script>
