<template>
  <div class="art-full-height">
    <ProTable
      :key="tableKey"
      ref="proTableRef"
      row-key="deptId"
      :request="requestDeptList"
      :columns="columns"
      :table-props="tableProps"
      :pagination-options="{ hideOnSinglePage: true }"
      :use-table-options="{ responseAdapter: deptResponseAdapter, onSuccess: handleTableSuccess }"
    >
      <template #toolbar-left>
        <ElSpace wrap>
          <ElButton v-auth="'system:dept:add'" @click="openAddDialog()" v-ripple>
            新增部门
          </ElButton>
          <ElButton v-auth="'system:dept:edit'" @click="saveSort" v-ripple>保存排序</ElButton>
          <ElButton @click="toggleExpand" v-ripple>{{ isExpanded ? '收起' : '展开' }}</ElButton>
        </ElSpace>
      </template>
    </ProTable>

    <ElDialog
      :model-value="dialogVisible"
      :title="dialogMode === 'add' ? '新增部门' : '编辑部门'"
      width="620px"
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
        label-width="90px"
        v-loading="formLoading"
      />

      <template #footer>
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="submitLoading" @click="submitForm">确定</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import ArtForm, { type FormItem } from '@/components/core/forms/art-form/index.vue'
  import { DICT_TYPE } from '@/types'
  import type { ProTableColumn, ProTableExpose } from '@/types/component'
  import { useAuth } from '@/hooks/core/useAuth'
  import {
    fetchAddDept,
    fetchDeleteDept,
    fetchGetDeptDetail,
    fetchGetDeptList,
    fetchGetDeptListExcludeChild,
    fetchUpdateDept,
    fetchUpdateDeptSort
  } from '@/api/system/dept'
  import { ElInputNumber, ElMessageBox, type FormRules } from 'element-plus'

  defineOptions({ name: 'Dept' })

  type DeptListItem = Api.SystemManage.DeptListItem
  type DialogMode = 'add' | 'edit'

  const { hasAuth } = useAuth()

  const proTableRef = ref<ProTableExpose<DeptListItem> | null>(null)
  const formRef = ref<InstanceType<typeof ArtForm>>()
  const dialogVisible = ref(false)
  const dialogMode = ref<DialogMode>('add')
  const formLoading = ref(false)
  const submitLoading = ref(false)
  const deptOptions = ref<DeptListItem[]>([])
  const isExpanded = ref(true)
  const tableKey = ref(0)
  const originalOrders = ref<Record<number, number | string | undefined>>({})

  const createDefaultForm = (): Api.SystemManage.DeptPayload => ({
    deptId: undefined,
    parentId: undefined,
    deptName: undefined,
    orderNum: 0,
    leader: undefined,
    phone: undefined,
    email: undefined,
    status: '0'
  })

  const form = reactive<Api.SystemManage.DeptPayload>(createDefaultForm())

  const treeProps = {
    value: 'deptId',
    label: 'deptName',
    children: 'children'
  }

  const tableProps = computed(() => ({
    stripe: false,
    defaultExpandAll: isExpanded.value,
    treeProps: { children: 'children', hasChildren: 'hasChildren' }
  }))

  const rules: FormRules<Api.SystemManage.DeptPayload> = {
    parentId: [{ required: true, message: '上级部门不能为空', trigger: 'change' }],
    deptName: [{ required: true, message: '部门名称不能为空', trigger: 'blur' }],
    orderNum: [{ required: true, message: '显示排序不能为空', trigger: 'blur' }],
    email: [{ type: 'email', message: '请输入正确的邮箱地址', trigger: ['blur', 'change'] }],
    phone: [
      {
        pattern: /^1[3|4|5|6|7|8|9][0-9]\d{8}$/,
        message: '请输入正确的手机号码',
        trigger: 'blur'
      }
    ]
  }

  const formItems = computed<FormItem[]>(() => [
    {
      key: 'parentId',
      label: '上级部门',
      type: 'treeselect',
      span: 24,
      hidden: form.parentId === 0,
      props: {
        data: deptOptions.value,
        props: treeProps,
        valueKey: 'deptId',
        checkStrictly: true,
        defaultExpandAll: true,
        placeholder: '请选择上级部门'
      }
    },
    {
      key: 'deptName',
      label: '部门名称',
      type: 'input',
      props: {
        placeholder: '请输入部门名称'
      }
    },
    {
      key: 'orderNum',
      label: '显示排序',
      type: 'number',
      props: {
        min: 0,
        controlsPosition: 'right',
        style: { width: '100%' }
      }
    },
    {
      key: 'leader',
      label: '负责人',
      type: 'input',
      props: {
        maxlength: 20,
        placeholder: '请输入负责人'
      }
    },
    {
      key: 'phone',
      label: '联系电话',
      type: 'input',
      props: {
        maxlength: 11,
        placeholder: '请输入联系电话'
      }
    },
    {
      key: 'email',
      label: '邮箱',
      type: 'input',
      props: {
        maxlength: 50,
        placeholder: '请输入邮箱'
      }
    },
    {
      key: 'status',
      label: '部门状态',
      type: 'dict-radio-group',
      props: {
        dictType: DICT_TYPE.NORMAL_DISABLE
      }
    }
  ])

  const columns: ProTableColumn<DeptListItem, Api.SystemManage.DeptQueryParams>[] = [
    {
      prop: 'deptName',
      label: '部门名称',
      minWidth: 240,
      search: {
        props: {
          placeholder: '请输入部门名称'
        }
      },
      formatter: (row) => row.deptName || '-'
    },
    {
      prop: 'orderNum',
      label: '排序',
      width: 120,
      cellRender: (row) => {
        if (!hasAuth('system:dept:edit')) {
          return h('span', row.orderNum != null ? String(row.orderNum) : '-')
        }

        return h(ElInputNumber, {
          modelValue: Number(row.orderNum ?? 0),
          min: 0,
          controlsPosition: 'right',
          style: { width: '96px' },
          'onUpdate:modelValue': (value: number | undefined) => {
            row.orderNum = value ?? 0
          }
        })
      }
    },
    {
      prop: 'status',
      label: '状态',
      width: 120,
      dictType: DICT_TYPE.NORMAL_DISABLE,
      valueType: 'dict-tag',
      search: {
        props: {
          placeholder: '请选择状态'
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
      width: 180,
      fixed: 'right',
      align: 'right',
      cellRender: (row) => {
        const actions = []

        if (hasAuth('system:dept:edit')) {
          actions.push(
            h(ArtButtonTable, {
              type: 'edit',
              onClick: () => openEditDialog(row)
            })
          )
        }

        if (hasAuth('system:dept:add')) {
          actions.push(
            h(ArtButtonTable, {
              type: 'add',
              onClick: () => openAddDialog(row)
            })
          )
        }

        if (hasAuth('system:dept:remove') && row.parentId !== 0) {
          actions.push(
            h(ArtButtonTable, {
              type: 'delete',
              onClick: () => deleteDept(row)
            })
          )
        }

        return actions.length ? h('div', { style: 'text-align: right' }, actions) : '-'
      }
    }
  ]

  const assertDeptList = (list: DeptListItem[]): DeptListItem[] => {
    if (!Array.isArray(list)) {
      throw new Error('部门列表接口返回值不符合约定：应为数组')
    }
    return list
  }

  const buildDeptTree = (list: DeptListItem[]): DeptListItem[] => {
    const nodeMap = new Map<number, DeptListItem>()
    const roots: DeptListItem[] = []

    list.forEach((item) => {
      if (typeof item.deptId !== 'number') {
        throw new Error('部门列表接口返回值不符合约定：deptId 必须为数字')
      }
      nodeMap.set(item.deptId, { ...item, children: [] })
    })

    list.forEach((item) => {
      const node = nodeMap.get(item.deptId!)
      const parentId = item.parentId
      if (typeof parentId === 'number' && parentId !== 0 && nodeMap.has(parentId)) {
        nodeMap.get(parentId)!.children!.push(node!)
      } else {
        roots.push(node!)
      }
    })

    return roots
  }

  const recordOriginalOrders = (list: DeptListItem[]) => {
    const nextOrders: Record<number, number | string | undefined> = {}

    const collect = (nodes: DeptListItem[]) => {
      nodes.forEach((item) => {
        if (typeof item.deptId === 'number') {
          nextOrders[item.deptId] = item.orderNum
        }
        if (Array.isArray(item.children) && item.children.length > 0) {
          collect(item.children)
        }
      })
    }

    collect(list)
    originalOrders.value = nextOrders
  }

  const deptResponseAdapter = (response: DeptListItem[]) => {
    const tree = buildDeptTree(assertDeptList(response))
    return {
      records: tree,
      total: 0,
      current: 1,
      size: tree.length || 10
    }
  }

  const handleTableSuccess = (data: DeptListItem[]) => {
    recordOriginalOrders(data)
  }

  const requestDeptList = async (params: Record<string, any>) => {
    const nextParams: Api.SystemManage.DeptQueryParams = {}
    if (params.deptName) {
      nextParams.deptName = params.deptName
    }
    if (params.status) {
      nextParams.status = params.status
    }
    return fetchGetDeptList(nextParams)
  }

  const loadDeptOptions = async (excludeDeptId?: number) => {
    const list =
      typeof excludeDeptId === 'number'
        ? await fetchGetDeptListExcludeChild(excludeDeptId)
        : await fetchGetDeptList()
    deptOptions.value = buildDeptTree(assertDeptList(list))
  }

  const resetForm = () => {
    Object.assign(form, createDefaultForm())
    formRef.value?.ref?.resetFields()
  }

  const openAddDialog = async (row?: DeptListItem) => {
    resetForm()
    dialogMode.value = 'add'
    form.parentId = row?.deptId
    await loadDeptOptions()
    dialogVisible.value = true
  }

  const openEditDialog = async (row: DeptListItem) => {
    if (typeof row.deptId !== 'number') {
      throw new Error('部门ID缺失，无法编辑')
    }

    resetForm()
    dialogMode.value = 'edit'
    dialogVisible.value = true
    formLoading.value = true
    try {
      const [detail] = await Promise.all([fetchGetDeptDetail(row.deptId), loadDeptOptions(row.deptId)])
      Object.assign(form, detail)
    } finally {
      formLoading.value = false
    }
  }

  const submitForm = async () => {
    await formRef.value?.validate()

    submitLoading.value = true
    try {
      if (dialogMode.value === 'edit') {
        if (typeof form.deptId !== 'number') {
          throw new Error('更新部门时缺少 deptId')
        }
        await fetchUpdateDept({ ...form })
      } else {
        await fetchAddDept({ ...form })
      }
      ElMessage.success(dialogMode.value === 'edit' ? '修改成功' : '新增成功')
      dialogVisible.value = false
      await proTableRef.value?.refreshData()
    } finally {
      submitLoading.value = false
    }
  }

  const getCurrentDeptRows = () => {
    const exposedData = proTableRef.value?.data as
      | DeptListItem[]
      | { value?: DeptListItem[] }
      | undefined
    return Array.isArray(exposedData) ? exposedData : exposedData?.value || []
  }

  const saveSort = async () => {
    const changedDeptIds: number[] = []
    const changedOrderNums: Array<number | string> = []

    const collectChanged = (list: DeptListItem[]) => {
      list.forEach((item) => {
        if (typeof item.deptId === 'number') {
          if (String(originalOrders.value[item.deptId]) !== String(item.orderNum)) {
            changedDeptIds.push(item.deptId)
            changedOrderNums.push(item.orderNum ?? 0)
          }
        }

        if (Array.isArray(item.children) && item.children.length > 0) {
          collectChanged(item.children)
        }
      })
    }

    collectChanged(getCurrentDeptRows())

    if (changedDeptIds.length === 0) {
      ElMessage.warning('未检测到排序修改')
      return
    }

    await fetchUpdateDeptSort({
      deptIds: changedDeptIds.join(','),
      orderNums: changedOrderNums.join(',')
    })
    ElMessage.success('排序保存成功')
    recordOriginalOrders(getCurrentDeptRows())
  }

  const deleteDept = async (row: DeptListItem) => {
    if (typeof row.deptId !== 'number') {
      throw new Error('部门ID缺失，无法删除')
    }

    try {
      await ElMessageBox.confirm(`确认删除名称为 "${row.deptName}" 的数据吗？`, '删除确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      await fetchDeleteDept(row.deptId)
      ElMessage.success('删除成功')
      await proTableRef.value?.refreshData()
    } catch (error) {
      if (error === 'cancel' || error === 'close') return
      throw error
    }
  }

  const toggleExpand = () => {
    isExpanded.value = !isExpanded.value
    tableKey.value += 1
  }
</script>
