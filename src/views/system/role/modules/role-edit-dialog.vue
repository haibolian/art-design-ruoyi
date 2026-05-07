<template>
  <ElDialog
    :model-value="visible"
    :title="dialogTitle"
    width="720px"
    align-center
    destroy-on-close
    @update:model-value="handleVisibleChange"
    @closed="handleClosed"
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
    >
      <template #menuPermission>
        <div class="role-tree-section">
          <ElSpace wrap class="mb-3">
            <ElCheckbox
              v-model="menuExpand"
              @change="(value) => handleCheckedTreeExpand(Boolean(value))"
            >
              展开/折叠
            </ElCheckbox>
            <ElCheckbox
              v-model="menuNodeAll"
              @change="(value) => handleCheckedTreeNodeAll(Boolean(value))"
            >
              全选/全不选
            </ElCheckbox>
            <ElCheckbox v-model="form.menuCheckStrictly">父子联动</ElCheckbox>
          </ElSpace>
          <ElTree
            ref="menuRef"
            class="tree-border"
            :data="menuOptions"
            show-checkbox
            node-key="id"
            :check-strictly="!form.menuCheckStrictly"
            :props="treeProps"
            empty-text="暂无菜单数据"
          />
        </div>
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
  import { DICT_TYPE } from '@/types'
  import type { FormRules } from 'element-plus'
  import {
    fetchAddRole,
    fetchGetMenuTree,
    fetchGetRoleDetail,
    fetchGetRoleMenuTree,
    fetchUpdateRole
  } from '@/api/system/role'

  interface Props {
    visible: boolean
    type: 'add' | 'edit'
    roleId?: number | null
  }

  interface Emits {
    (e: 'update:visible', value: boolean): void
    (e: 'success'): void
  }

  interface RoleFormData {
    roleId?: number
    roleName?: string
    roleKey?: string
    roleSort: number
    status: '0' | '1'
    menuCheckStrictly: boolean
    remark?: string
  }

  const props = withDefaults(defineProps<Props>(), {
    visible: false,
    type: 'add',
    roleId: null
  })
  const emit = defineEmits<Emits>()

  const formRef = ref<InstanceType<typeof ArtForm>>()
  const menuRef = ref()
  const formLoading = ref(false)
  const submitLoading = ref(false)
  const menuOptions = ref<Api.SystemManage.TreeSelectNode[]>([])
  const menuExpand = ref(false)
  const menuNodeAll = ref(false)

  const treeProps = {
    label: 'label',
    children: 'children'
  }

  const createDefaultForm = (): RoleFormData => ({
    roleId: undefined,
    roleName: undefined,
    roleKey: undefined,
    roleSort: 0,
    status: '0',
    menuCheckStrictly: true,
    remark: undefined
  })

  const form = reactive<RoleFormData>(createDefaultForm())

  const rules: FormRules<RoleFormData> = {
    roleName: [{ required: true, message: '角色名称不能为空', trigger: 'blur' }],
    roleKey: [{ required: true, message: '权限字符不能为空', trigger: 'blur' }],
    roleSort: [{ required: true, message: '角色顺序不能为空', trigger: 'blur' }]
  }

  const formItems = computed<FormItem[]>(() => [
    {
      key: 'roleName',
      label: '角色名称',
      type: 'input',
      props: {
        maxlength: 30,
        placeholder: '请输入角色名称'
      }
    },
    {
      key: 'roleKey',
      label: '权限字符',
      type: 'input',
      props: {
        maxlength: 100,
        placeholder: '请输入权限字符'
      }
    },
    {
      key: 'roleSort',
      label: '角色顺序',
      type: 'number',
      props: {
        min: 0,
        controlsPosition: 'right',
        style: { width: '100%' }
      }
    },
    {
      key: 'status',
      label: '状态',
      type: 'dict-radio-group',
      props: {
        dictType: DICT_TYPE.NORMAL_DISABLE
      }
    },
    {
      key: 'menuPermission',
      label: '菜单权限',
      span: 24
    },
    {
      key: 'remark',
      label: '备注',
      span: 24,
      type: 'input',
      props: {
        type: 'textarea',
        rows: 3,
        placeholder: '请输入内容'
      }
    }
  ])

  const dialogTitle = computed(() => (props.type === 'add' ? '新增角色' : '编辑角色'))

  const normalizeText = (value?: string): string | undefined => {
    const text = value?.trim()
    return text ? text : undefined
  }

  const resetFormData = () => {
    Object.assign(form, createDefaultForm())
    menuOptions.value = []
    menuExpand.value = false
    menuNodeAll.value = false
  }

  const setCheckedMenuKeys = async (checkedKeys: number[]) => {
    await nextTick()
    if (!menuRef.value) return

    menuRef.value.setCheckedKeys([])
    checkedKeys.forEach((key) => {
      menuRef.value.setChecked(key, true, false)
    })
  }

  const loadAddData = async () => {
    menuOptions.value = await fetchGetMenuTree()
  }

  const loadEditData = async (roleId: number) => {
    const [roleDetail, roleMenuTree] = await Promise.all([
      fetchGetRoleDetail(roleId),
      fetchGetRoleMenuTree(roleId)
    ])

    Object.assign(form, {
      roleId: roleDetail.roleId,
      roleName: roleDetail.roleName,
      roleKey: roleDetail.roleKey || roleDetail.roleCode,
      roleSort: Number(roleDetail.roleSort ?? 0),
      status: (roleDetail.status || '0') as '0' | '1',
      menuCheckStrictly: roleDetail.menuCheckStrictly ?? true,
      remark: roleDetail.remark
    })

    menuOptions.value = roleMenuTree.menus || []
    await setCheckedMenuKeys(roleMenuTree.checkedKeys || [])
  }

  const initForm = async () => {
    formLoading.value = true
    try {
      resetFormData()
      if (props.type === 'add') {
        await loadAddData()
        return
      }

      if (typeof props.roleId !== 'number') {
        throw new Error('编辑角色时缺少 roleId')
      }

      await loadEditData(props.roleId)
    } finally {
      formLoading.value = false
    }
  }

  const getAllCheckedMenuKeys = (): number[] => {
    if (!menuRef.value) return []

    const checkedKeys = menuRef.value.getCheckedKeys() as number[]
    const halfCheckedKeys = menuRef.value.getHalfCheckedKeys() as number[]
    return [...new Set([...checkedKeys, ...halfCheckedKeys])]
  }

  const buildPayload = (): Api.SystemManage.RolePayload => {
    if (props.type === 'edit' && typeof form.roleId !== 'number') {
      throw new Error('更新角色时缺少 roleId')
    }

    return {
      roleId: form.roleId,
      roleName: normalizeText(form.roleName),
      roleKey: normalizeText(form.roleKey),
      roleSort: Number(form.roleSort ?? 0),
      status: form.status,
      menuCheckStrictly: form.menuCheckStrictly,
      menuIds: getAllCheckedMenuKeys(),
      remark: normalizeText(form.remark)
    }
  }

  const handleSubmit = async () => {
    await formRef.value?.validate()

    submitLoading.value = true
    try {
      const payload = buildPayload()
      if (props.type === 'add') {
        await fetchAddRole(payload)
      } else {
        await fetchUpdateRole(payload)
      }
      ElMessage.success(props.type === 'add' ? '新增成功' : '修改成功')
      emit('success')
      emit('update:visible', false)
    } finally {
      submitLoading.value = false
    }
  }

  const handleCheckedTreeExpand = (value: boolean) => {
    const nodeMap = menuRef.value?.store?.nodesMap || {}
    Object.values(nodeMap).forEach((node: any) => {
      node.expanded = value
    })
  }

  const handleCheckedTreeNodeAll = (value: boolean) => {
    if (!menuRef.value) return
    menuRef.value.setCheckedNodes(value ? menuOptions.value : [])
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
