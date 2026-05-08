<template>
  <div class="user-page art-full-height">
    <div class="user-layout">
      <ElCard class="dept-card" shadow="never">
        <ElInput
          v-model="deptKeyword"
          class="mb-3"
          clearable
          placeholder="请输入部门名称"
          @input="filterDeptTree"
        />
        <ElTree
          ref="deptTreeRef"
          :data="deptOptions"
          :props="deptTreeProps"
          node-key="id"
          highlight-current
          default-expand-all
          :filter-node-method="filterDeptNode"
          @node-click="handleDeptNodeClick"
        />
      </ElCard>

      <div class="table-panel">
        <ProTable ref="proTableRef" :request="requestUserList" :columns="columns">
          <template #toolbar-left="{ selectedRows }">
            <ElSpace wrap>
              <ElButton v-auth="'system:user:add'" @click="showDialog('add')" v-ripple>
                新增用户
              </ElButton>
              <ElButton
                v-auth="'system:user:remove'"
                :disabled="selectedRows.length === 0"
                @click="deleteUser()"
                v-ripple
              >
                批量删除
              </ElButton>
              <ElButton v-auth="'system:user:import'" @click="importVisible = true" v-ripple>
                导入
              </ElButton>
              <ElButton v-auth="'system:user:export'" @click="exportUser" v-ripple> 导出 </ElButton>
            </ElSpace>
          </template>
        </ProTable>
      </div>
    </div>

    <UserDialog
      v-model:visible="dialogVisible"
      :type="dialogType"
      :user-id="currentUserId"
      @success="handleDialogSuccess"
    />

    <ElDrawer v-model="detailVisible" title="用户详情" size="520px" destroy-on-close>
      <ElDescriptions v-if="detailUser" :column="1" border>
        <ElDescriptionsItem label="用户编号">{{ detailUser.userId || '-' }}</ElDescriptionsItem>
        <ElDescriptionsItem label="用户名称">{{ detailUser.userName || '-' }}</ElDescriptionsItem>
        <ElDescriptionsItem label="用户昵称">{{ detailUser.nickName || '-' }}</ElDescriptionsItem>
        <ElDescriptionsItem label="部门">
          {{ detailUser.dept?.deptName || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="手机号码">
          {{ detailUser.phonenumber || detailUser.userPhone || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="邮箱">
          {{ detailUser.email || detailUser.userEmail || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="性别">
          <ArtDictTag :dict-type="DICT_TYPE.USER_SEX" :value="detailUser.sex" />
        </ElDescriptionsItem>
        <ElDescriptionsItem label="状态">
          <ArtDictTag :dict-type="DICT_TYPE.NORMAL_DISABLE" :value="detailUser.status" />
        </ElDescriptionsItem>
        <ElDescriptionsItem label="岗位">{{ formatPostGroup(detailUser) }}</ElDescriptionsItem>
        <ElDescriptionsItem label="角色">{{ formatRoleGroup(detailUser) }}</ElDescriptionsItem>
        <ElDescriptionsItem label="创建时间">{{ detailUser.createTime || '-' }}</ElDescriptionsItem>
        <ElDescriptionsItem label="登录 IP">{{ detailUser.loginIp || '-' }}</ElDescriptionsItem>
        <ElDescriptionsItem label="登录时间">{{ detailUser.loginDate || '-' }}</ElDescriptionsItem>
        <ElDescriptionsItem label="备注">{{ detailUser.remark || '-' }}</ElDescriptionsItem>
      </ElDescriptions>
    </ElDrawer>

    <ElDialog
      v-model="importVisible"
      title="用户导入"
      width="520px"
      align-center
      @closed="resetImportDialog"
    >
      <ElUpload
        ref="importUploadRef"
        drag
        action="#"
        accept=".xlsx,.xls"
        :auto-upload="false"
        :limit="1"
        :on-exceed="handleImportExceed"
        @change="handleImportFileChange"
        @remove="handleImportFileRemove"
      >
        <div class="import-placeholder">
          <ArtSvgIcon icon="ri:upload-cloud-2-line" class="text-4xl text-primary" />
          <p>点击或拖拽 Excel 文件到此处上传</p>
        </div>
      </ElUpload>
      <div class="import-options">
        <ElCheckbox v-model="updateSupport"> 是否更新已经存在的用户数据 </ElCheckbox>
        <ElButton link type="primary" @click="downloadTemplate">下载模板</ElButton>
      </div>
      <template #footer>
        <ElButton @click="importVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="importLoading" @click="submitImport">确定</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import ArtDictTag from '@/components/core/display/art-dict-tag/index.vue'
  import UserDialog from './modules/user-dialog.vue'
  import { useAuth } from '@/hooks/core/useAuth'
  import { createTimestampedFilename, downloadBlob } from '@/utils/file/download'
  import { DICT_TYPE } from '@/types'
  import type { ProTableColumn, ProTableExpose } from '@/types/component'
  import {
    fetchChangeUserStatus,
    fetchDeleteUser,
    fetchDownloadUserImportTemplate,
    fetchExportUser,
    fetchGetDeptTree,
    fetchGetUserDetail,
    fetchGetUserList,
    fetchImportUser,
    fetchResetUserPwd
  } from '@/api/system/user'
  import {
    ElButton,
    ElMessageBox,
    ElSwitch,
    genFileId,
    type UploadFile,
    type UploadInstance,
    type UploadProps,
    type UploadRawFile
  } from 'element-plus'

  defineOptions({ name: 'User' })

  type UserListItem = Api.SystemManage.UserListItem
  type DialogType = 'add' | 'edit'

  const { hasAuth } = useAuth()

  const dialogType = ref<DialogType>('add')
  const dialogVisible = ref(false)
  const detailVisible = ref(false)
  const importVisible = ref(false)
  const importLoading = ref(false)
  const updateSupport = ref(false)
  const currentUserId = ref<number | null>(null)
  const detailUser = ref<UserListItem | null>(null)
  const proTableRef = ref<ProTableExpose<UserListItem> | null>(null)
  const importUploadRef = ref<UploadInstance>()
  const importFile = ref<UploadFile>()
  const deptTreeRef = ref()
  const deptOptions = ref<Api.SystemManage.TreeSelectNode[]>([])
  const deptKeyword = ref('')
  const selectedDeptId = ref<number | undefined>()

  const deptTreeProps = {
    label: 'label',
    children: 'children'
  }

  const columns: ProTableColumn<UserListItem, Api.SystemManage.UserSearchParams>[] = [
    { type: 'selection' },
    { type: 'index', width: 60, label: '序号' },
    {
      prop: 'userId',
      label: '用户编号',
      width: 100,
      formatter: (row) => row.userId || '-'
    },
    {
      prop: 'userName',
      label: '用户名称',
      minWidth: 140,
      search: { props: { placeholder: '请输入用户名称' } },
      cellRender: (row) =>
        h(
          ElButton,
          {
            link: true,
            type: 'primary',
            onClick: () => openDetail(row)
          },
          () => row.userName || '-'
        )
    },
    {
      prop: 'nickName',
      label: '用户昵称',
      minWidth: 140,
      formatter: (row) => row.nickName || '-'
    },
    {
      prop: 'dept',
      label: '部门',
      minWidth: 160,
      formatter: (row) => row.dept?.deptName || '-'
    },
    {
      prop: 'phonenumber',
      label: '手机号码',
      minWidth: 130,
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
      width: 120,
      dictType: DICT_TYPE.NORMAL_DISABLE,
      search: { props: { placeholder: '用户状态' } },
      cellRender: (row) => {
        if (!hasAuth('system:user:edit')) {
          return h(ArtDictTag, {
            dictType: DICT_TYPE.NORMAL_DISABLE,
            value: row.status || '0'
          })
        }

        return h(ElSwitch, {
          modelValue: row.status || '0',
          activeValue: '0',
          inactiveValue: '1',
          disabled: row.userId === 1,
          'onUpdate:modelValue': (value: string | number | boolean) => {
            void handleStatusChange(row, value as '0' | '1')
          }
        })
      }
    },
    {
      prop: 'createTime',
      label: '创建时间',
      minWidth: 160,
      search: {
        type: 'daterange',
        span: 12,
        props: {
          type: 'daterange',
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
      },
      formatter: (row) => row.createTime || '-'
    },
    {
      prop: 'operation',
      label: '操作',
      width: 220,
      fixed: 'right',
      cellRender: (row) => {
        const actions: any[] = []

        if (hasAuth('system:user:edit') && row.userId !== 1) {
          actions.push(
            h(ArtButtonTable, {
              type: 'edit',
              onClick: () => showDialog('edit', row)
            })
          )
        }

        if (hasAuth('system:user:remove') && row.userId !== 1) {
          actions.push(
            h(ArtButtonTable, {
              type: 'delete',
              onClick: () => deleteUser(row)
            })
          )
        }

        if (hasAuth('system:user:resetPwd') && row.userId !== 1) {
          actions.push(
            h(ArtButtonTable, {
              icon: 'ri:key-line',
              iconClass: 'bg-warning/12 text-warning',
              onClick: () => resetPassword(row)
            })
          )
        }

        return actions.length > 0 ? h('div', actions) : '-'
      }
    }
  ]

  const requestUserList = (params: Api.SystemManage.UserSearchParams) => {
    return fetchGetUserList({
      ...params,
      deptId: selectedDeptId.value
    })
  }

  const filterDeptTree = () => {
    deptTreeRef.value?.filter(deptKeyword.value)
  }

  const filterDeptNode = (keyword: string, data: Api.SystemManage.TreeSelectNode) => {
    if (!keyword) return true
    return String(data.label || '').includes(keyword)
  }

  const loadDeptTree = async () => {
    deptOptions.value = await fetchGetDeptTree()
  }

  const handleDeptNodeClick = async (node: Api.SystemManage.TreeSelectNode) => {
    selectedDeptId.value = typeof node.id === 'number' ? node.id : Number(node.id)
    await proTableRef.value?.getData()
  }

  const showDialog = (type: DialogType, row?: UserListItem): void => {
    dialogType.value = type
    currentUserId.value = row?.userId ?? null
    dialogVisible.value = true
  }

  const getSelectedUserIds = (row?: UserListItem) => {
    if (row?.userId) {
      return [row.userId]
    }

    const selectedRows = proTableRef.value?.selectedRows as
      | UserListItem[]
      | { value: UserListItem[] }
      | undefined
    const rows = Array.isArray(selectedRows) ? selectedRows : selectedRows?.value || []
    return rows.map((item) => item.userId).filter((id): id is number => typeof id === 'number')
  }

  const deleteUser = async (row?: UserListItem): Promise<void> => {
    const ids = getSelectedUserIds(row)

    if (ids.length === 0) {
      ElMessage.warning('请先选择需要删除的用户')
      return
    }

    try {
      await ElMessageBox.confirm(
        `是否确认删除用户编号为 "${ids.join(',')}" 的数据项？`,
        '删除确认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
      await fetchDeleteUser(ids)
      ElMessage.success('删除成功')
      await proTableRef.value?.refreshRemove()
    } catch (error) {
      if (error === 'cancel' || error === 'close') return
      throw error
    }
  }

  const handleStatusChange = async (row: UserListItem, nextStatus: '0' | '1') => {
    if (!row.userId) {
      throw new Error('用户ID缺失，无法修改状态')
    }

    const prevStatus = (row.status || '0') as '0' | '1'
    row.status = nextStatus

    const actionText = nextStatus === '0' ? '启用' : '停用'
    try {
      await ElMessageBox.confirm(`确认要${actionText}用户 "${row.userName}" 吗？`, '状态变更确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      await fetchChangeUserStatus(row.userId, nextStatus)
      ElMessage.success(`${actionText}成功`)
    } catch (error) {
      row.status = prevStatus
      if (error === 'cancel' || error === 'close') return
      throw error
    }
  }

  const resetPassword = async (row: UserListItem) => {
    if (!row.userId) {
      throw new Error('用户ID缺失，无法重置密码')
    }

    try {
      const { value } = await ElMessageBox.prompt(
        `请输入用户 "${row.userName}" 的新密码`,
        '重置密码',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          closeOnClickModal: false,
          inputPattern: /^.{5,20}$/,
          inputErrorMessage: '用户密码长度必须介于 5 和 20 之间',
          inputValidator: (password: string) => {
            if (/<|>|"|'|\||\\/.test(password)) {
              return '不能包含非法字符：< > " \' \\ |'
            }
            return true
          }
        }
      )

      await fetchResetUserPwd(row.userId, value)
      ElMessage.success(`修改成功，新密码是：${value}`)
    } catch (error) {
      if (error === 'cancel' || error === 'close') return
      throw error
    }
  }

  const openDetail = async (row: UserListItem) => {
    if (!row.userId) return
    const detail = await fetchGetUserDetail(row.userId)
    detailUser.value = detail.data || row
    detailVisible.value = true
  }

  const formatPostGroup = (user: UserListItem) => {
    if (Array.isArray(user.posts) && user.posts.length > 0) {
      return (
        user.posts
          .map((item) => item.postName)
          .filter(Boolean)
          .join('、') || '-'
      )
    }
    return '-'
  }

  const formatRoleGroup = (user: UserListItem) => {
    if (Array.isArray(user.roles) && user.roles.length > 0) {
      return (
        user.roles
          .map((item) => item.roleName)
          .filter(Boolean)
          .join('、') || '-'
      )
    }
    return '-'
  }

  const getCurrentExportParams = (): Api.SystemManage.UserSearchParams => {
    const exposedModel = proTableRef.value?.searchModel as
      | Record<string, any>
      | { value: Record<string, any> }
      | undefined
    const model = exposedModel && 'value' in exposedModel ? exposedModel.value : exposedModel || {}
    const params: Api.SystemManage.UserSearchParams = {}

    if (model.userName) params.userName = model.userName
    if (model.phonenumber) params.phonenumber = model.phonenumber
    if (model.status) params.status = model.status
    if (selectedDeptId.value) params.deptId = selectedDeptId.value

    const range = Array.isArray(model.createTime) ? model.createTime : []
    if (range.length === 2) {
      params.params = {
        beginTime: range[0],
        endTime: range[1]
      }
    }

    return params
  }

  const exportUser = async () => {
    const blob = await fetchExportUser(getCurrentExportParams())
    downloadBlob(blob, createTimestampedFilename('user', 'xlsx'))
  }

  const downloadTemplate = async () => {
    const blob = await fetchDownloadUserImportTemplate()
    downloadBlob(blob, 'user_template.xlsx')
  }

  const isExcelFile = (file: { name?: string }) => {
    const fileName = file.name || ''
    return /\.(xlsx|xls)$/i.test(fileName)
  }

  const handleImportFileChange = (file: UploadFile) => {
    const isExcel = isExcelFile(file)
    if (!isExcel) {
      ElMessage.error('请上传 xls 或 xlsx 格式文件')
      importFile.value = undefined
      nextTick(() => importUploadRef.value?.clearFiles())
      return
    }
    importFile.value = file
  }

  const handleImportFileRemove = (file: UploadFile) => {
    if (!importFile.value || importFile.value.uid === file.uid) {
      importFile.value = undefined
    }
  }

  const handleImportExceed: UploadProps['onExceed'] = (files) => {
    const file = files[0] as UploadRawFile | undefined
    if (!file) return

    file.uid = genFileId()
    importUploadRef.value?.clearFiles()
    importUploadRef.value?.handleStart(file)
  }

  const resetImportDialog = () => {
    importLoading.value = false
    updateSupport.value = false
    importFile.value = undefined
    importUploadRef.value?.clearFiles()
  }

  const submitImport = async () => {
    if (!importFile.value?.raw) {
      ElMessage.warning('请先选择需要导入的文件')
      return
    }

    const formData = new FormData()
    formData.append('file', importFile.value.raw)
    formData.append('updateSupport', String(updateSupport.value))
    importLoading.value = true
    try {
      const result = await fetchImportUser(formData)
      ElMessage.success(result.msg || '导入成功')
      importVisible.value = false
      await proTableRef.value?.refreshData()
    } finally {
      importLoading.value = false
    }
  }

  const handleDialogSuccess = async () => {
    dialogVisible.value = false
    currentUserId.value = null
    await proTableRef.value?.refreshData()
  }

  onMounted(() => {
    void loadDeptTree()
  })
</script>

<style scoped>
  .user-page {
    min-height: 0;
  }

  .user-layout {
    display: grid;
    grid-template-columns: 260px minmax(0, 1fr);
    gap: 16px;
    height: 100%;
    min-height: 0;
  }

  .dept-card,
  .table-panel {
    min-height: 0;
  }

  .dept-card :deep(.el-card__body) {
    height: 100%;
    overflow: auto;
  }

  .table-panel {
    overflow: hidden;
  }

  .import-placeholder {
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: center;
    justify-content: center;
    min-height: 130px;
  }

  .import-options {
    display: flex;
    gap: 12px;
    align-items: center;
    justify-content: space-between;
    margin-top: 16px;
  }

  @media (max-width: 900px) {
    .user-layout {
      grid-template-columns: 1fr;
      height: auto;
    }

    .dept-card {
      max-height: 320px;
    }
  }
</style>
