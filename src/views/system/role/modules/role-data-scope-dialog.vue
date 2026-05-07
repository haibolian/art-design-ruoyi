<template>
  <ElDialog
    :model-value="visible"
    title="分配数据权限"
    width="640px"
    align-center
    destroy-on-close
    @update:model-value="handleVisibleChange"
    @closed="handleClosed"
  >
    <ArtForm
      ref="formRef"
      v-model="form"
      :items="formItems"
      :show-reset="false"
      :show-submit="false"
      :span="12"
      label-width="90px"
      v-loading="formLoading"
    >
      <template #deptPermission>
        <div v-if="form.dataScope === '2'" class="role-tree-section">
          <ElSpace wrap class="mb-3">
            <ElCheckbox
              v-model="deptExpand"
              @change="(value) => handleCheckedTreeExpand(Boolean(value))"
            >
              展开/折叠
            </ElCheckbox>
            <ElCheckbox
              v-model="deptNodeAll"
              @change="(value) => handleCheckedTreeNodeAll(Boolean(value))"
            >
              全选/全不选
            </ElCheckbox>
            <ElCheckbox v-model="form.deptCheckStrictly">父子联动</ElCheckbox>
          </ElSpace>
          <ElTree
            ref="deptRef"
            class="tree-border"
            :data="deptOptions"
            show-checkbox
            node-key="id"
            default-expand-all
            :check-strictly="!form.deptCheckStrictly"
            :props="treeProps"
            empty-text="暂无部门数据"
          />
        </div>
        <span v-else class="text-xs text-text-secondary">当前权限范围无需配置部门树。</span>
      </template>
    </ArtForm>

    <template #footer>
      <ElButton @click="handleCancel">取消</ElButton>
      <ElButton type="primary" :loading="submitLoading" @click="handleSubmit">确定</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import ArtForm, { type FormItem } from '@/components/core/forms/art-form/index.vue'
  import {
    fetchGetRoleDeptTree,
    fetchGetRoleDetail,
    fetchUpdateRoleDataScope
  } from '@/api/system/role'

  interface Props {
    visible: boolean
    roleId?: number | null
  }

  interface Emits {
    (e: 'update:visible', value: boolean): void
    (e: 'success'): void
  }

  interface RoleDataScopeForm {
    roleId?: number
    roleName?: string
    roleKey?: string
    dataScope: '1' | '2' | '3' | '4' | '5'
    deptCheckStrictly: boolean
  }

  const DATA_SCOPE_OPTIONS = [
    { label: '全部数据权限', value: '1' },
    { label: '自定数据权限', value: '2' },
    { label: '本部门数据权限', value: '3' },
    { label: '本部门及以下数据权限', value: '4' },
    { label: '仅本人数据权限', value: '5' }
  ] as const

  const props = withDefaults(defineProps<Props>(), {
    visible: false,
    roleId: null
  })
  const emit = defineEmits<Emits>()

  const formRef = ref<InstanceType<typeof ArtForm>>()
  const deptRef = ref()
  const formLoading = ref(false)
  const submitLoading = ref(false)
  const deptOptions = ref<Api.SystemManage.TreeSelectNode[]>([])
  const deptExpand = ref(true)
  const deptNodeAll = ref(false)

  const treeProps = {
    label: 'label',
    children: 'children'
  }

  const createDefaultForm = (): RoleDataScopeForm => ({
    roleId: undefined,
    roleName: undefined,
    roleKey: undefined,
    dataScope: '1',
    deptCheckStrictly: true
  })

  const form = reactive<RoleDataScopeForm>(createDefaultForm())

  const formItems = computed<FormItem[]>(() => [
    {
      key: 'roleName',
      label: '角色名称',
      type: 'input',
      props: {
        disabled: true
      }
    },
    {
      key: 'roleKey',
      label: '权限字符',
      type: 'input',
      props: {
        disabled: true
      }
    },
    {
      key: 'dataScope',
      label: '权限范围',
      span: 24,
      type: 'select',
      props: {
        options: DATA_SCOPE_OPTIONS,
        placeholder: '请选择权限范围',
        onChange: handleDataScopeChange
      }
    },
    {
      key: 'deptPermission',
      label: '数据权限',
      span: 24
    }
  ])

  const resetFormData = () => {
    Object.assign(form, createDefaultForm())
    deptOptions.value = []
    deptExpand.value = true
    deptNodeAll.value = false
  }

  const setCheckedDeptKeys = async (checkedKeys: number[]) => {
    await nextTick()
    if (!deptRef.value) return

    deptRef.value.setCheckedKeys([])
    checkedKeys.forEach((key) => {
      deptRef.value.setChecked(key, true, false)
    })
  }

  const initForm = async () => {
    if (typeof props.roleId !== 'number') {
      throw new Error('分配数据权限时缺少 roleId')
    }

    formLoading.value = true
    try {
      resetFormData()

      const [roleDetail, deptTree] = await Promise.all([
        fetchGetRoleDetail(props.roleId),
        fetchGetRoleDeptTree(props.roleId)
      ])

      Object.assign(form, {
        roleId: roleDetail.roleId,
        roleName: roleDetail.roleName,
        roleKey: roleDetail.roleKey || roleDetail.roleCode,
        dataScope: (roleDetail.dataScope || '1') as RoleDataScopeForm['dataScope'],
        deptCheckStrictly: roleDetail.deptCheckStrictly ?? true
      })

      deptOptions.value = deptTree.depts || []
      await setCheckedDeptKeys(deptTree.checkedKeys || [])
    } finally {
      formLoading.value = false
    }
  }

  const getAllCheckedDeptKeys = (): number[] => {
    if (!deptRef.value) return []

    const checkedKeys = deptRef.value.getCheckedKeys() as number[]
    const halfCheckedKeys = deptRef.value.getHalfCheckedKeys() as number[]
    return [...new Set([...checkedKeys, ...halfCheckedKeys])]
  }

  function handleDataScopeChange(value: RoleDataScopeForm['dataScope']) {
    if (value !== '2') {
      deptRef.value?.setCheckedKeys([])
    }
  }

  const handleSubmit = async () => {
    if (typeof form.roleId !== 'number') {
      throw new Error('分配数据权限时缺少 roleId')
    }

    submitLoading.value = true
    try {
      await fetchUpdateRoleDataScope({
        roleId: form.roleId,
        roleName: form.roleName,
        roleKey: form.roleKey,
        dataScope: form.dataScope,
        deptCheckStrictly: form.deptCheckStrictly,
        deptIds: form.dataScope === '2' ? getAllCheckedDeptKeys() : []
      })
      ElMessage.success('修改成功')
      emit('success')
      emit('update:visible', false)
    } finally {
      submitLoading.value = false
    }
  }

  const handleCheckedTreeExpand = (value: boolean) => {
    const nodeMap = deptRef.value?.store?.nodesMap || {}
    Object.values(nodeMap).forEach((node: any) => {
      node.expanded = value
    })
  }

  const handleCheckedTreeNodeAll = (value: boolean) => {
    if (!deptRef.value) return
    deptRef.value.setCheckedNodes(value ? deptOptions.value : [])
  }

  const handleCancel = () => {
    emit('update:visible', false)
  }

  const handleVisibleChange = (value: boolean) => {
    emit('update:visible', value)
  }

  const handleClosed = () => {
    formRef.value?.ref?.resetFields()
    resetFormData()
  }

  watch(
    () => props.visible,
    async (visible) => {
      if (!visible) return
      await initForm()
    }
  )
</script>

<style scoped lang="scss">
  .role-tree-section {
    width: 100%;
  }
</style>
