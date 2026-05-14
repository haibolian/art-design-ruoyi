<template>
  <div class="art-full-height">
    <ProTable ref="proTableRef" :request="fetchGetJobList" :columns="columns">
      <template #toolbar-left="{ selectedRows }">
        <ElSpace wrap>
          <ElButton v-auth="'monitor:job:add'" @click="openDialog('add')" v-ripple>
            新增任务
          </ElButton>
          <ElButton
            v-auth="'monitor:job:remove'"
            :disabled="selectedRows.length === 0"
            @click="deleteJob()"
            v-ripple
          >
            删除
          </ElButton>
          <ElButton v-auth="'monitor:job:export'" @click="exportJob" v-ripple>导出</ElButton>
          <ElButton v-auth="'monitor:job:query'" @click="openJobLog()" v-ripple>日志</ElButton>
        </ElSpace>
      </template>
    </ProTable>

    <ElDialog
      :model-value="dialogVisible"
      :title="dialogMode === 'add' ? '新增任务' : '编辑任务'"
      width="760px"
      align-center
      destroy-on-close
      @update:model-value="dialogVisible = $event"
      @closed="resetForm"
    >
      <ArtForm
        ref="formRef"
        v-model="form"
        :items="formItems"
        :rules="rules"
        :span="12"
        :show-reset="false"
        :show-submit="false"
        label-width="110px"
        v-loading="formLoading"
      />

      <template #footer>
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="submitLoading" @click="submitForm">确定</ElButton>
      </template>
    </ElDialog>

    <ElDialog
      v-model="cronDialogVisible"
      title="Cron表达式生成器"
      width="960px"
      destroy-on-close
      append-to-body
    >
      <JobCrontab
        @hide="cronDialogVisible = false"
        @fill="fillCronExpression"
        :expression="cronExpression"
      />
    </ElDialog>

    <ElDialog v-model="detailVisible" title="任务详细" width="820px" align-center destroy-on-close>
      <ElDescriptions v-if="currentRow" :column="2" border>
        <ElDescriptionsItem label="任务编号">{{ currentRow.jobId }}</ElDescriptionsItem>
        <ElDescriptionsItem label="任务名称">{{ currentRow.jobName }}</ElDescriptionsItem>
        <ElDescriptionsItem label="任务分组">
          <ArtDictTag :dict-type="DICT_TYPE.JOB_GROUP" :value="currentRow.jobGroup" />
        </ElDescriptionsItem>
        <ElDescriptionsItem label="任务状态">
          <ArtDictTag :dict-type="DICT_TYPE.JOB_STATUS" :value="currentRow.status" />
        </ElDescriptionsItem>
        <ElDescriptionsItem label="Cron 表达式">{{ currentRow.cronExpression }}</ElDescriptionsItem>
        <ElDescriptionsItem label="下次执行时间">{{ currentRow.nextValidTime }}</ElDescriptionsItem>
        <ElDescriptionsItem label="执行策略">
          {{ formatMisfirePolicy(currentRow.misfirePolicy) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="是否并发">
          {{ formatConcurrent(currentRow.concurrent) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="调用目标方法" :span="2">
          {{ currentRow.invokeTarget }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="创建人">{{ currentRow.createBy || '-' }}</ElDescriptionsItem>
        <ElDescriptionsItem label="创建时间">{{ currentRow.createTime || '-' }}</ElDescriptionsItem>
        <ElDescriptionsItem label="更新人">{{ currentRow.updateBy || '-' }}</ElDescriptionsItem>
        <ElDescriptionsItem label="更新时间">{{ currentRow.updateTime || '-' }}</ElDescriptionsItem>
        <ElDescriptionsItem v-if="currentRow.remark" label="备注" :span="2">
          {{ currentRow.remark }}
        </ElDescriptionsItem>
      </ElDescriptions>

      <template #footer>
        <ElButton @click="detailVisible = false">关闭</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import ArtButtonMore from '@/components/core/forms/art-button-more/index.vue'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import ArtDictTag from '@/components/core/display/art-dict-tag/index.vue'
  import ArtForm, { type FormItem } from '@/components/core/forms/art-form/index.vue'
  import JobCrontab from '@/components/monitor/job-crontab/index.vue'
  import { DICT_TYPE } from '@/types'
  import type { ProTableColumn, ProTableExpose } from '@/types/component'
  import { createTimestampedFilename, downloadBlob } from '@/utils/file/download'
  import {
    ElButton,
    ElMessage,
    ElMessageBox,
    ElSwitch,
    ElTooltip,
    type FormRules
  } from 'element-plus'
  import {
    fetchAddJob,
    fetchChangeJobStatus,
    fetchDeleteJob,
    fetchExportJob,
    fetchGetJobDetail,
    fetchGetJobList,
    fetchRunJob,
    fetchUpdateJob
  } from '@/api/system/job'
  import { useAuth } from '@/hooks/core/useAuth'

  defineOptions({ name: 'Job' })

  type JobListItem = Api.Monitor.JobListItem
  type DialogMode = 'add' | 'edit'
  type JobAction = {
    key: string
    label: string
    type?: 'edit' | 'delete' | 'view'
    icon?: string
    auth: string
    color?: string
    onClick: () => void
  }

  const router = useRouter()
  const { hasAuth } = useAuth()
  const proTableRef = ref<ProTableExpose<JobListItem> | null>(null)
  const formRef = ref<InstanceType<typeof ArtForm>>()
  const dialogVisible = ref(false)
  const detailVisible = ref(false)
  const cronDialogVisible = ref(false)
  const dialogMode = ref<DialogMode>('add')
  const formLoading = ref(false)
  const submitLoading = ref(false)
  const currentRow = ref<JobListItem>()
  const cronExpression = ref('')

  const misfirePolicyText = {
    '0': '默认策略',
    '1': '立即执行',
    '2': '执行一次',
    '3': '放弃执行'
  }

  const concurrentText = {
    '0': '允许',
    '1': '禁止'
  }

  const formatMisfirePolicy = (value: JobListItem['misfirePolicy']) =>
    value !== undefined ? (misfirePolicyText[value] ?? value) : value

  const formatConcurrent = (value: JobListItem['concurrent']) =>
    value !== undefined ? (concurrentText[value] ?? value) : value

  const createDefaultForm = (): Api.Monitor.JobPayload => ({
    jobId: undefined,
    jobName: undefined,
    jobGroup: undefined,
    invokeTarget: undefined,
    cronExpression: undefined,
    misfirePolicy: '1',
    concurrent: '1',
    status: '0'
  })

  const form = reactive<Api.Monitor.JobPayload>(createDefaultForm())

  const rules: FormRules<Api.Monitor.JobPayload> = {
    jobName: [{ required: true, message: '任务名称不能为空', trigger: 'blur' }],
    jobGroup: [{ required: true, message: '任务分组不能为空', trigger: 'change' }],
    invokeTarget: [{ required: true, message: '调用目标字符串不能为空', trigger: 'blur' }],
    cronExpression: [{ required: true, message: 'Cron 表达式不能为空', trigger: 'blur' }]
  }

  const formItems = computed<FormItem[]>(() => [
    {
      key: 'jobName',
      label: '任务名称',
      type: 'input',
      props: { placeholder: '请输入任务名称' }
    },
    {
      key: 'jobGroup',
      label: '任务分组',
      type: 'dict-select',
      props: {
        dictType: DICT_TYPE.JOB_GROUP,
        placeholder: '请选择任务分组'
      }
    },
    {
      key: 'invokeTarget',
      label: '调用方法',
      type: 'input',
      span: 24,
      props: { placeholder: '请输入调用目标字符串' }
    },
    {
      key: 'cronExpression',
      label: 'Cron 表达式',
      type: 'input',
      span: 24,
      props: { placeholder: '请输入 Cron 执行表达式' },
      slots: {
        append: () =>
          h(
            ElButton,
            {
              type: 'primary',
              onClick: openCronDialog
            },
            () => '生成表达式'
          )
      }
    },
    {
      key: 'status',
      label: '任务状态',
      type: 'dict-radio-group',
      hidden: form.jobId === undefined,
      span: 24,
      props: { dictType: DICT_TYPE.JOB_STATUS }
    },
    {
      key: 'misfirePolicy',
      label: '执行策略',
      type: 'radiogroup',
      span: 12,
      props: {
        options: [
          { label: '立即执行', value: '1' },
          { label: '执行一次', value: '2' },
          { label: '放弃执行', value: '3' }
        ]
      }
    },
    {
      key: 'concurrent',
      label: '是否并发',
      type: 'radiogroup',
      span: 12,
      props: {
        options: [
          { label: '允许', value: '0' },
          { label: '禁止', value: '1' }
        ]
      }
    }
  ])

  const columns: ProTableColumn<JobListItem, Api.Monitor.JobSearchParams>[] = [
    { type: 'selection' },
    { type: 'index', width: 60, label: '序号' },
    { prop: 'jobId', label: '任务编号', width: 100 },
    {
      prop: 'jobName',
      label: '任务名称',
      minWidth: 140,
      search: true,
      showOverflowTooltip: true,
      formatter: (row) => row.jobName as string
    },
    {
      prop: 'jobGroup',
      label: '任务组名',
      width: 130,
      dictType: DICT_TYPE.JOB_GROUP,
      valueType: 'dict-tag',
      search: true
    },
    {
      prop: 'invokeTarget',
      label: '调用目标字符串',
      minWidth: 220,
      showOverflowTooltip: true,
      formatter: (row) => row.invokeTarget as string
    },
    {
      prop: 'cronExpression',
      label: 'Cron 表达式',
      minWidth: 160,
      showOverflowTooltip: true,
      formatter: (row) => row.cronExpression as string
    },
    {
      prop: 'status',
      label: '任务状态',
      width: 110,
      search: {
        type: 'dict-select',
        props: { dictType: DICT_TYPE.JOB_STATUS }
      },
      cellRender: (row) =>
        h(ElSwitch, {
          modelValue: row.status as string,
          activeValue: '0',
          inactiveValue: '1',
          disabled: !hasAuth('monitor:job:changeStatus'),
          'onUpdate:modelValue': (value: string | number | boolean) => {
            row.status = value as '0' | '1'
          },
          onChange: () => changeStatus(row)
        })
    },
    {
      prop: 'operation',
      label: '操作',
      width: 260,
      fixed: 'right',
      align: 'right',
      cellRender: (row) => {
        const actions: JobAction[] = [
          {
            key: 'edit',
            label: '修改',
            type: 'edit',
            auth: 'monitor:job:edit',
            onClick: () => openDialog('edit', row)
          },
          {
            key: 'delete',
            label: '删除',
            type: 'delete',
            auth: 'monitor:job:remove',
            onClick: () => deleteJob(row)
          },
          {
            key: 'run',
            label: '执行一次',
            icon: 'ri:play-fill',
            auth: 'monitor:job:changeStatus',
            onClick: () => runJob(row)
          },
          {
            key: 'detail',
            label: '任务详细',
            type: 'view',
            auth: 'monitor:job:query',
            onClick: () => openDetail(row)
          },
          {
            key: 'log',
            label: '调度日志',
            icon: 'ri:file-list-3-line',
            auth: 'monitor:job:query',
            onClick: () => openJobLog(row)
          }
        ].filter((item) => hasAuth(item.auth))

        if (actions.length === 0) return ''

        const directActions = actions.slice(0, 3)
        const moreActions = actions.slice(3)

        return h(
          'div',
          {
            style:
              'text-align: right; display: inline-flex; align-items: center; justify-content: flex-end;'
          },
          [
            ...directActions.map((action) =>
              renderAction(action.label, action.type, action.onClick, action.icon)
            ),
            moreActions.length
              ? h(ArtButtonMore, {
                  list: moreActions.map((action) => ({
                    key: action.key,
                    label: action.label,
                    icon: action.icon,
                    color: action.color
                  })),
                  onClick: (item: { key: string | number }) => {
                    const action = moreActions.find((candidate) => candidate.key === item.key)
                    action?.onClick()
                  }
                })
              : null
          ]
        )
      }
    }
  ]

  const renderAction = (
    content: string,
    type: 'edit' | 'delete' | 'view' | undefined,
    onClick: () => void,
    icon?: string
  ) =>
    h(ElTooltip, { content, placement: 'top' }, () =>
      h(ArtButtonTable, {
        type,
        icon,
        onClick
      })
    )

  const openCronDialog = () => {
    cronExpression.value = form.cronExpression || ''
    cronDialogVisible.value = true
  }

  const fillCronExpression = (value: string) => {
    form.cronExpression = value
  }

  const resetForm = () => {
    Object.assign(form, createDefaultForm())
    formRef.value?.ref?.resetFields()
  }

  const openDialog = async (mode: DialogMode, row?: JobListItem) => {
    resetForm()
    dialogMode.value = mode
    dialogVisible.value = true

    if (mode === 'edit') {
      if (typeof row?.jobId !== 'number') {
        throw new Error('编辑任务时缺少 jobId')
      }
      formLoading.value = true
      try {
        Object.assign(form, await fetchGetJobDetail(row.jobId))
      } finally {
        formLoading.value = false
      }
    }
  }

  const submitForm = async () => {
    if (!formRef.value) return
    await formRef.value.validate()
    submitLoading.value = true
    try {
      if (dialogMode.value === 'edit') {
        if (typeof form.jobId !== 'number') {
          throw new Error('更新任务时缺少 jobId')
        }
        await fetchUpdateJob({ ...form })
      } else {
        await fetchAddJob({ ...form })
      }
      ElMessage.success(dialogMode.value === 'edit' ? '修改成功' : '新增成功')
      dialogVisible.value = false
      await proTableRef.value?.refreshData()
    } finally {
      submitLoading.value = false
    }
  }

  const getSelectedIds = () =>
    (proTableRef.value?.selectedRows ?? [])
      .map((item) => item.jobId)
      .filter((jobId): jobId is number => typeof jobId === 'number')

  const deleteJob = async (row?: JobListItem) => {
    const ids = row?.jobId ? [row.jobId] : getSelectedIds()
    if (ids.length === 0) {
      ElMessage.warning('请先选择需要删除的任务')
      return
    }

    try {
      await ElMessageBox.confirm(
        `确认删除定时任务编号为 "${ids.join(',')}" 的数据吗？`,
        '删除确认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
      await fetchDeleteJob(ids)
      ElMessage.success('删除成功')
      await proTableRef.value?.refreshRemove()
    } catch (error) {
      if (error === 'cancel' || error === 'close') return
      throw error
    }
  }

  const getCurrentExportParams = (): Api.Monitor.JobSearchParams => {
    const exposedModel = proTableRef.value?.searchModel as
      | Record<string, any>
      | { value: Record<string, any> }
      | undefined
    const model = exposedModel && 'value' in exposedModel ? exposedModel.value : exposedModel || {}
    const params: Api.Monitor.JobSearchParams = {}

    if (model.jobName) params.jobName = model.jobName
    if (model.jobGroup) params.jobGroup = model.jobGroup
    if (model.status) params.status = model.status

    return params
  }

  const exportJob = async () => {
    const blob = await fetchExportJob(getCurrentExportParams())
    downloadBlob(blob, createTimestampedFilename('job', 'xlsx'))
  }

  const changeStatus = async (row: JobListItem) => {
    if (typeof row.jobId !== 'number') {
      throw new Error('修改任务状态时缺少 jobId')
    }
    if (!row.status) {
      throw new Error('修改任务状态时缺少 status')
    }

    const text = row.status === '0' ? '启用' : '停用'
    try {
      await ElMessageBox.confirm(`确认要${text} "${row.jobName}" 任务吗？`, '状态确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      await fetchChangeJobStatus(row.jobId, row.status)
      ElMessage.success(`${text}成功`)
    } catch (error) {
      row.status = row.status === '0' ? '1' : '0'
      if (error === 'cancel' || error === 'close') return
      throw error
    }
  }

  const runJob = async (row: JobListItem) => {
    if (typeof row.jobId !== 'number') {
      throw new Error('执行任务时缺少 jobId')
    }
    if (!row.jobGroup) {
      throw new Error('执行任务时缺少 jobGroup')
    }

    try {
      await ElMessageBox.confirm(`确认立即执行一次 "${row.jobName}" 任务吗？`, '执行确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      await fetchRunJob(row.jobId, row.jobGroup)
      ElMessage.success('执行成功')
    } catch (error) {
      if (error === 'cancel' || error === 'close') return
      throw error
    }
  }

  const openDetail = async (row: JobListItem) => {
    if (typeof row.jobId !== 'number') {
      throw new Error('查看任务详情时缺少 jobId')
    }
    currentRow.value = await fetchGetJobDetail(row.jobId)
    detailVisible.value = true
  }

  const openJobLog = (row?: JobListItem) => {
    const params = typeof row?.jobId === 'number' ? { jobId: row.jobId } : {}
    router.push({ name: 'JobLog', params })
  }
</script>
