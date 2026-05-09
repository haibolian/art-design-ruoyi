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
      label-width="100px"
      v-loading="formLoading"
    >
      <template #icon>
        <ElInput v-model="form.icon" clearable placeholder="请输入图标名称，如 ri:user-3-line">
          <template #prefix>
            <ArtSvgIcon v-if="form.icon" :icon="form.icon" class="text-g-600" />
          </template>
        </ElInput>
      </template>
    </ArtForm>

    <template #footer>
      <ElButton @click="handleCancel">取消</ElButton>
      <ElButton type="primary" :loading="submitLoading" @click="handleSubmit">确定</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import ArtForm, { type FormItem } from '@/components/core/forms/art-form/index.vue'
  import { DICT_TYPE } from '@/types'
  import type { FormRules, FormItemRule } from 'element-plus'
  import {
    fetchAddMenu,
    fetchGetMenuDetail,
    fetchGetMenuList,
    fetchUpdateMenu
  } from '@/api/system/menu'

  interface Props {
    visible: boolean
    mode: 'add' | 'edit'
    menuId: number | null
    parentId: number
  }

  interface Emits {
    (e: 'update:visible', value: boolean): void
    (e: 'success'): void
  }

  interface MenuTreeOption {
    menuId: number
    menuName: string
    children?: MenuTreeOption[]
  }

  interface MenuFormData {
    menuId?: number
    parentId: number
    menuName: string
    icon: string
    menuType: Api.SystemManage.MenuType
    orderNum: number
    isFrame: '0' | '1'
    isCache: '0' | '1'
    visible: '0' | '1'
    status: '0' | '1'
    path: string
    component: string
    query: string
    perms: string
    routeName: string
  }

  const props = withDefaults(defineProps<Props>(), {
    visible: false,
    mode: 'add',
    menuId: null,
    parentId: 0
  })
  const emit = defineEmits<Emits>()

  const formRef = ref<InstanceType<typeof ArtForm>>()
  const formLoading = ref(false)
  const submitLoading = ref(false)
  const menuOptions = ref<MenuTreeOption[]>([])

  const treeProps = {
    value: 'menuId',
    label: 'menuName',
    children: 'children'
  }

  const createDefaultForm = (): MenuFormData => ({
    menuId: undefined,
    parentId: 0,
    menuName: '',
    icon: '',
    menuType: 'M',
    orderNum: 0,
    isFrame: '1',
    isCache: '0',
    visible: '0',
    status: '0',
    path: '',
    component: '',
    query: '',
    perms: '',
    routeName: ''
  })

  const form = reactive<MenuFormData>(createDefaultForm())

  const radioOptions = {
    menuType: [
      { label: '目录', value: 'M' },
      { label: '菜单', value: 'C' },
      { label: '按钮', value: 'F' }
    ],
    isFrame: [
      { label: '是', value: '0' },
      { label: '否', value: '1' }
    ],
    isCache: [
      { label: '缓存', value: '0' },
      { label: '不缓存', value: '1' }
    ]
  } as const

  const validatePath: NonNullable<FormItemRule['validator']> = (_rule, value, callback) => {
    const current = typeof value === 'string' ? value : ''
    if (form.menuType === 'F') {
      callback()
      return
    }
    if (!current.trim()) {
      callback(new Error('路由地址不能为空'))
      return
    }
    callback()
  }

  const rules: FormRules<MenuFormData> = {
    menuName: [{ required: true, message: '菜单名称不能为空', trigger: 'blur' }],
    orderNum: [{ required: true, message: '显示排序不能为空', trigger: 'blur' }],
    path: [{ validator: validatePath, trigger: 'blur' }]
  }

  const formItems = computed<FormItem[]>(() => [
    {
      key: 'parentId',
      label: '上级菜单',
      type: 'treeselect',
      span: 24,
      props: {
        data: menuOptions.value,
        props: treeProps,
        valueKey: 'menuId',
        checkStrictly: true,
        defaultExpandAll: true,
        placeholder: '请选择上级菜单'
      }
    },
    {
      key: 'menuType',
      label: '菜单类型',
      type: 'radiogroup',
      span: 24,
      props: {
        options: radioOptions.menuType
      }
    },
    {
      key: 'icon',
      label: '菜单图标',
      type: 'input',
      hidden: form.menuType === 'F'
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
      key: 'menuName',
      label: '菜单名称',
      type: 'input',
      props: {
        placeholder: '请输入菜单名称'
      }
    },
    {
      key: 'routeName',
      label: '路由名称',
      type: 'input',
      hidden: form.menuType !== 'C',
      props: {
        placeholder: '请输入路由名称'
      }
    },
    {
      key: 'isFrame',
      label: '是否外链',
      type: 'radiogroup',
      hidden: form.menuType === 'F',
      props: {
        options: radioOptions.isFrame
      }
    },
    {
      key: 'path',
      label: '路由地址',
      type: 'input',
      hidden: form.menuType === 'F',
      props: {
        placeholder: '请输入路由地址'
      }
    },
    {
      key: 'component',
      label: '组件路径',
      type: 'input',
      hidden: form.menuType !== 'C',
      props: {
        placeholder: '请输入组件路径，如 system/user/index'
      }
    },
    {
      key: 'perms',
      label: '权限字符',
      type: 'input',
      hidden: form.menuType === 'M',
      props: {
        placeholder: '请输入权限字符'
      }
    },
    {
      key: 'query',
      label: '路由参数',
      type: 'input',
      hidden: form.menuType !== 'C',
      props: {
        placeholder: '请输入路由参数，如 {\"id\":1}'
      }
    },
    {
      key: 'isCache',
      label: '是否缓存',
      type: 'radiogroup',
      hidden: form.menuType !== 'C',
      props: {
        options: radioOptions.isCache
      }
    },
    {
      key: 'visible',
      label: '显示状态',
      type: 'dict-radio-group',
      hidden: form.menuType === 'F',
      props: {
        dictType: DICT_TYPE.SHOW_HIDE
      }
    },
    {
      key: 'status',
      label: '菜单状态',
      type: 'dict-radio-group',
      props: {
        dictType: DICT_TYPE.NORMAL_DISABLE
      }
    }
  ])

  const dialogTitle = computed(() => (props.mode === 'edit' ? '编辑菜单' : '新增菜单'))

  const normalizeText = (value?: string) => {
    const text = value?.trim()
    return text ? text : undefined
  }

  const resetFormData = () => {
    Object.assign(form, createDefaultForm())
    menuOptions.value = []
  }

  const buildMenuTree = (list: Api.SystemManage.MenuListItem[]): MenuTreeOption[] => {
    const nodeMap = new Map<number, MenuTreeOption>()
    const roots: MenuTreeOption[] = []

    list.forEach((item) => {
      if (typeof item.menuId !== 'number') return
      nodeMap.set(item.menuId, {
        menuId: item.menuId,
        menuName: item.menuName || '未命名菜单',
        children: []
      })
    })

    list.forEach((item) => {
      if (typeof item.menuId !== 'number') return
      const node = nodeMap.get(item.menuId)
      if (!node) return
      const parentId = Number(item.parentId ?? 0)
      if (parentId !== 0 && nodeMap.has(parentId)) {
        nodeMap.get(parentId)!.children!.push(node)
      } else {
        roots.push(node)
      }
    })

    return [
      {
        menuId: 0,
        menuName: '主类目',
        children: roots
      }
    ]
  }

  const loadMenuOptions = async () => {
    const list = await fetchGetMenuList()
    menuOptions.value = buildMenuTree(list)
  }

  const loadEditData = async (menuId: number) => {
    const data = await fetchGetMenuDetail(menuId)
    Object.assign(form, {
      menuId: data.menuId,
      parentId: data.parentId ?? 0,
      menuName: data.menuName ?? '',
      icon: data.icon ?? '',
      menuType: data.menuType ?? 'M',
      orderNum: Number(data.orderNum ?? 0),
      isFrame: data.isFrame ?? '1',
      isCache: data.isCache ?? '0',
      visible: data.visible ?? '0',
      status: data.status ?? '0',
      path: data.path ?? '',
      component: data.component ?? '',
      query: data.query ?? '',
      perms: data.perms ?? '',
      routeName: data.routeName ?? ''
    })
  }

  const initializeForm = async () => {
    formLoading.value = true
    try {
      resetFormData()
      await loadMenuOptions()

      if (props.mode === 'add') {
        form.parentId = props.parentId ?? 0
        return
      }

      if (props.menuId === null) {
        throw new Error('编辑菜单时缺少 menuId')
      }

      await loadEditData(props.menuId)
    } finally {
      formLoading.value = false
    }
  }

  const buildPayload = (): Api.SystemManage.MenuPayload => {
    return {
      menuId: form.menuId,
      parentId: form.parentId,
      menuName: form.menuName.trim(),
      icon: form.menuType === 'F' ? undefined : normalizeText(form.icon),
      menuType: form.menuType,
      orderNum: form.orderNum,
      isFrame: form.menuType === 'F' ? '1' : form.isFrame,
      isCache: form.menuType === 'C' ? form.isCache : '1',
      visible: form.menuType === 'F' ? '0' : form.visible,
      status: form.status,
      path: form.menuType === 'F' ? undefined : normalizeText(form.path),
      component: form.menuType === 'C' ? normalizeText(form.component) : undefined,
      query: form.menuType === 'C' ? normalizeText(form.query) : undefined,
      perms: form.menuType === 'M' ? undefined : normalizeText(form.perms),
      routeName: form.menuType === 'C' ? normalizeText(form.routeName) : undefined
    }
  }

  const handleSubmit = async () => {
    await formRef.value?.validate()
    submitLoading.value = true
    try {
      const payload = buildPayload()
      if (props.mode === 'edit') {
        if (typeof payload.menuId !== 'number') {
          throw new Error('更新菜单时缺少 menuId')
        }
        await fetchUpdateMenu(payload)
      } else {
        await fetchAddMenu(payload)
      }
      ElMessage.success(props.mode === 'edit' ? '修改成功' : '新增成功')
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
    formRef.value?.ref?.resetFields()
    resetFormData()
  }

  watch(
    () => props.visible,
    async (visible) => {
      if (!visible) return
      await initializeForm()
    }
  )

  watch(
    () => form.menuType,
    (menuType) => {
      if (menuType === 'M') {
        form.perms = ''
        form.component = ''
        form.query = ''
        form.routeName = ''
      } else if (menuType === 'F') {
        form.icon = ''
        form.path = ''
        form.component = ''
        form.query = ''
        form.routeName = ''
        form.isFrame = '1'
        form.isCache = '1'
        form.visible = '0'
      }
    }
  )
</script>
