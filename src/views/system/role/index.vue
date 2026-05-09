<template>
  <div class="art-full-height">
    <ProTable ref="proTableRef" :request="fetchGetRoleList" :columns="columns">
      <template #toolbar-left="{ selectedRows }">
        <ElSpace wrap>
          <ElButton v-auth="'system:role:add'" @click="showDialog('add')" v-ripple>
            新增角色
          </ElButton>
          <ElButton
            v-auth="'system:role:remove'"
            :disabled="selectedRows.length === 0"
            @click="deleteRole()"
            v-ripple
          >
            删除
          </ElButton>
          <ElButton v-auth="'system:role:export'" @click="exportRole" v-ripple>导出</ElButton>
        </ElSpace>
      </template>
    </ProTable>

    <RoleEditDialog
      v-model:visible="dialogVisible"
      :type="dialogType"
      :role-id="currentRoleId"
      @success="handleDialogSuccess"
    />

    <RoleDataScopeDialog
      v-model:visible="dataScopeVisible"
      :role-id="currentDataScopeRoleId"
      @success="handleDataScopeSuccess"
    />
  </div>
</template>

<script setup lang="ts">
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import ArtDictTag from '@/components/core/display/art-dict-tag/index.vue'
  import { DICT_TYPE } from '@/types'
  import type { ProTableColumn, ProTableExpose } from '@/types/component'
  import {
    fetchChangeRoleStatus,
    fetchDeleteRole,
    fetchExportRole,
    fetchGetRoleList
  } from '@/api/system/role'
  import { useAuth } from '@/hooks/core/useAuth'
  import { createTimestampedFilename, downloadBlob } from '@/utils/file/download'
  import RoleDataScopeDialog from './modules/role-data-scope-dialog.vue'
  import RoleEditDialog from './modules/role-edit-dialog.vue'

  defineOptions({ name: 'Role' })

  type RoleListItem = Api.SystemManage.RoleListItem
  type DialogType = 'add' | 'edit'

  const { hasAuth } = useAuth()
  const router = useRouter()

  const proTableRef = ref<ProTableExpose<RoleListItem> | null>(null)
  const dialogVisible = ref(false)
  const dataScopeVisible = ref(false)
  const dialogType = ref<DialogType>('add')
  const currentRoleId = ref<number | null>(null)
  const currentDataScopeRoleId = ref<number | null>(null)

  const columns: ProTableColumn<RoleListItem, Api.SystemManage.RoleSearchParams>[] = [
    { type: 'selection' },
    { type: 'index', width: 60, label: '序号' },
    {
      prop: 'roleId',
      label: '角色编号',
      width: 100,
      formatter: (row) => (row.roleId != null ? String(row.roleId) : '-')
    },
    {
      prop: 'roleName',
      label: '角色名称',
      minWidth: 140,
      search: {
        props: {
          placeholder: '请输入角色名称'
        }
      },
      formatter: (row) => row.roleName || '-'
    },
    {
      prop: 'roleKey',
      label: '权限字符',
      minWidth: 160,
      search: {
        props: {
          placeholder: '请输入权限字符'
        }
      },
      formatter: (row) => row.roleKey || row.roleCode || '-'
    },
    {
      prop: 'roleSort',
      label: '角色顺序',
      width: 100,
      formatter: (row) => (row.roleSort != null ? String(row.roleSort) : '-')
    },
    {
      prop: 'status',
      label: '状态',
      width: 120,
      dictType: DICT_TYPE.NORMAL_DISABLE,
      search: {
        props: {
          placeholder: '请选择状态'
        }
      },
      cellRender: (row) => {
        if (!hasAuth('system:role:edit')) {
          return h(ArtDictTag, {
            dictType: DICT_TYPE.NORMAL_DISABLE,
            value: row.status || '0',
            effect: 'light'
          })
        }

        return h(ElSwitch, {
          modelValue: row.status || '0',
          activeValue: '0',
          inactiveValue: '1',
          disabled: row.roleId === 1,
          'onUpdate:modelValue': (value: string | number | boolean) => {
            void handleStatusChange(row, value as '0' | '1')
          }
        })
      }
    },
    {
      prop: 'createTimeRange',
      label: '创建时间',
      hideInTable: true,
      search: {
        type: 'daterange',
        props: {
          valueFormat: 'YYYY-MM-DD',
          startPlaceholder: '开始日期',
          endPlaceholder: '结束日期'
        },
        transform: (value) => {
          const range = Array.isArray(value) ? value : []
          return {
            params: {
              beginTime: range[0],
              endTime: range[1]
            }
          }
        }
      }
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
      width: 220,
      fixed: 'right',
      cellRender: (row) => {
        const actions: any[] = []

        if (hasAuth('system:role:edit') && row.roleId !== 1) {
          actions.push(
            h(ArtButtonTable, {
              type: 'edit',
              onClick: () => showDialog('edit', row)
            })
          )
          actions.push(
            h(ArtButtonTable, {
              icon: 'ri:database-2-line',
              iconClass: 'bg-warning/12 text-warning',
              onClick: () => openDataScopeDialog(row)
            })
          )
          actions.push(
            h(ArtButtonTable, {
              icon: 'ri:user-shared-line',
              iconClass: 'bg-info/12 text-info',
              onClick: () => openRoleAuthUser(row)
            })
          )
        }

        if (hasAuth('system:role:remove') && row.roleId !== 1) {
          actions.push(
            h(ArtButtonTable, {
              type: 'delete',
              onClick: () => deleteRole(row)
            })
          )
        }

        return actions.length > 0 ? h('div', actions) : '-'
      }
    }
  ]

  const showDialog = (type: DialogType, row?: RoleListItem) => {
    dialogType.value = type
    currentRoleId.value = row?.roleId ?? null
    dialogVisible.value = true
  }

  const openDataScopeDialog = (row: RoleListItem) => {
    currentDataScopeRoleId.value = row.roleId ?? null
    dataScopeVisible.value = true
  }

  const openRoleAuthUser = async (row: RoleListItem) => {
    if (typeof row.roleId !== 'number') return
    await router.push({ name: 'RoleAuthUser', params: { roleId: row.roleId } })
  }

  const getSelectedRoleIds = (row?: RoleListItem) => {
    if (row?.roleId) {
      return [row.roleId]
    }

    const selectedRows = proTableRef.value?.selectedRows as
      | RoleListItem[]
      | { value: RoleListItem[] }
      | undefined
    const rows = Array.isArray(selectedRows) ? selectedRows : selectedRows?.value || []
    return rows.map((item) => item.roleId).filter((id): id is number => typeof id === 'number')
  }

  const deleteRole = async (row?: RoleListItem) => {
    const ids = getSelectedRoleIds(row)
    if (ids.length === 0) {
      ElMessage.warning('请先选择需要删除的角色')
      return
    }

    try {
      await ElMessageBox.confirm(
        `确认删除角色编号为 "${ids.join(',')}" 的数据吗？该操作不可恢复。`,
        '删除确认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
      await fetchDeleteRole(ids)
      ElMessage.success('删除成功')
      await proTableRef.value?.refreshRemove()
    } catch (error) {
      if (error === 'cancel' || error === 'close') return
      throw error
    }
  }

  const handleStatusChange = async (row: RoleListItem, nextStatus: '0' | '1') => {
    if (!row.roleId) {
      throw new Error('角色ID缺失，无法修改状态')
    }

    const prevStatus = (row.status || '0') as '0' | '1'
    row.status = nextStatus

    const actionText = nextStatus === '0' ? '启用' : '停用'
    try {
      await ElMessageBox.confirm(`确认要${actionText}角色 "${row.roleName}" 吗？`, '状态变更确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      await fetchChangeRoleStatus(row.roleId, nextStatus)
      ElMessage.success(`${actionText}成功`)
    } catch (error) {
      row.status = prevStatus
      if (error === 'cancel' || error === 'close') return
      throw error
    }
  }

  const getCurrentExportParams = (): Api.SystemManage.RoleSearchParams => {
    const exposedModel = proTableRef.value?.searchModel as
      | Record<string, any>
      | { value: Record<string, any> }
      | undefined
    const model = exposedModel && 'value' in exposedModel ? exposedModel.value : exposedModel || {}
    const params: Api.SystemManage.RoleSearchParams = {}

    if (model.roleName) params.roleName = model.roleName
    if (model.roleKey) params.roleKey = model.roleKey
    if (model.status) params.status = model.status

    const range = Array.isArray(model.createTimeRange) ? model.createTimeRange : []
    if (range.length === 2) {
      params.params = {
        beginTime: range[0],
        endTime: range[1]
      }
    }

    return params
  }

  const exportRole = async () => {
    const blob = await fetchExportRole(getCurrentExportParams())
    downloadBlob(blob, createTimestampedFilename('role', 'xlsx'))
  }

  const handleDialogSuccess = async () => {
    dialogVisible.value = false
    await proTableRef.value?.refreshData()
  }

  const handleDataScopeSuccess = async () => {
    dataScopeVisible.value = false
    await proTableRef.value?.refreshData()
  }
</script>
