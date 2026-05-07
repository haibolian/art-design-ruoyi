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
    />

    <template #footer>
      <ElButton @click="handleCancel">取消</ElButton>
      <ElButton type="primary" :loading="submitLoading" @click="handleSubmit">确定</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import ArtForm, { type FormItem } from '@/components/core/forms/art-form/index.vue'
  import {
    fetchAddUser,
    fetchGetConfigKey,
    fetchGetDeptTree,
    fetchGetUserDetail,
    fetchUpdateUser
  } from '@/api/system/user'
  import { DICT_TYPE } from '@/types'
  import type { FormItemRule, FormRules } from 'element-plus'

  interface Props {
    visible: boolean
    type: 'add' | 'edit'
    userId?: number | null
  }

  interface Emits {
    (e: 'update:visible', value: boolean): void
    (e: 'success'): void
  }

  interface UserFormData {
    userId?: number
    deptId?: number
    userName?: string
    nickName?: string
    password?: string
    phonenumber?: string
    email?: string
    sex?: '0' | '1' | '2'
    status?: '0' | '1'
    postIds: number[]
    roleIds: number[]
    remark?: string
  }

  const props = withDefaults(defineProps<Props>(), {
    visible: false,
    type: 'add',
    userId: null
  })
  const emit = defineEmits<Emits>()

  const formRef = ref<InstanceType<typeof ArtForm>>()
  const formLoading = ref(false)
  const submitLoading = ref(false)
  const deptOptions = ref<Api.SystemManage.TreeSelectNode[]>([])
  const postOptions = ref<Api.SystemManage.PostItem[]>([])
  const roleOptions = ref<Api.SystemManage.RoleOption[]>([])
  const initPassword = ref('')

  const treeProps = {
    value: 'id',
    label: 'label',
    children: 'children'
  }

  const postSelectOptions = computed(() =>
    postOptions.value
      .filter((item) => typeof item.postId === 'number')
      .map((item) => ({
        label: item.postName || '',
        value: item.postId,
        disabled: item.status === '1'
      }))
  )

  const roleSelectOptions = computed(() =>
    roleOptions.value
      .filter((item) => typeof item.roleId === 'number')
      .map((item) => ({
        label: item.roleName || '',
        value: item.roleId,
        disabled: item.status === '1'
      }))
  )

  const createDefaultForm = (): UserFormData => ({
    userId: undefined,
    deptId: undefined,
    userName: undefined,
    nickName: undefined,
    password: undefined,
    phonenumber: undefined,
    email: undefined,
    sex: '0',
    status: '0',
    postIds: [],
    roleIds: [],
    remark: undefined
  })

  const form = reactive<UserFormData>(createDefaultForm())

  const validateUserName: NonNullable<FormItemRule['validator']> = (_rule, value, callback) => {
    if (props.type !== 'add') {
      callback()
      return
    }
    const current = typeof value === 'string' ? value.trim() : ''
    if (!current) {
      callback(new Error('用户名称不能为空'))
      return
    }
    if (current.length < 2 || current.length > 20) {
      callback(new Error('用户名称长度必须介于 2 和 20 之间'))
      return
    }
    callback()
  }

  const validatePassword: NonNullable<FormItemRule['validator']> = (_rule, value, callback) => {
    if (props.type !== 'add') {
      callback()
      return
    }
    const current = typeof value === 'string' ? value : ''
    if (!current) {
      callback(new Error('用户密码不能为空'))
      return
    }
    if (current.length < 5 || current.length > 20) {
      callback(new Error('用户密码长度必须介于 5 和 20 之间'))
      return
    }
    if (/<|>|"|'|\||\\/.test(current)) {
      callback(new Error('不能包含非法字符：< > " \' \\ |'))
      return
    }
    callback()
  }

  const rules: FormRules<UserFormData> = {
    userName: [{ validator: validateUserName, trigger: 'blur' }],
    nickName: [{ required: true, message: '用户昵称不能为空', trigger: 'blur' }],
    password: [{ validator: validatePassword, trigger: 'blur' }],
    email: [
      { type: 'email', message: '请输入正确的邮箱地址', trigger: ['blur', 'change'] },
      { max: 50, message: '邮箱长度不能超过 50 个字符', trigger: 'blur' }
    ],
    phonenumber: [
      {
        pattern: /^1[3|4|5|6|7|8|9][0-9]\d{8}$/,
        message: '请输入正确的手机号码',
        trigger: 'blur'
      }
    ]
  }

  const formItems = computed<FormItem[]>(() => [
    {
      key: 'nickName',
      label: '用户昵称',
      type: 'input',
      props: { maxlength: 30, placeholder: '请输入用户昵称' }
    },
    {
      key: 'deptId',
      label: '归属部门',
      type: 'treeselect',
      props: {
        data: deptOptions.value,
        props: treeProps,
        valueKey: 'id',
        checkStrictly: true,
        clearable: true,
        defaultExpandAll: true,
        placeholder: '请选择归属部门'
      }
    },
    {
      key: 'phonenumber',
      label: '手机号码',
      type: 'input',
      props: { maxlength: 11, placeholder: '请输入手机号码' }
    },
    {
      key: 'email',
      label: '邮箱',
      type: 'input',
      props: { maxlength: 50, placeholder: '请输入邮箱' }
    },
    {
      key: 'userName',
      label: '用户名称',
      type: 'input',
      hidden: props.type !== 'add',
      props: { maxlength: 30, placeholder: '请输入用户名称' }
    },
    {
      key: 'password',
      label: '用户密码',
      type: 'input',
      hidden: props.type !== 'add',
      props: {
        type: 'password',
        showPassword: true,
        maxlength: 20,
        placeholder: '请输入用户密码'
      }
    },
    {
      key: 'sex',
      label: '用户性别',
      type: 'dict-select',
      props: { dictType: DICT_TYPE.USER_SEX, placeholder: '请选择' }
    },
    {
      key: 'status',
      label: '状态',
      type: 'dict-radio-group',
      props: { dictType: DICT_TYPE.NORMAL_DISABLE }
    },
    {
      key: 'postIds',
      label: '岗位',
      type: 'select',
      props: {
        multiple: true,
        collapseTags: true,
        options: postSelectOptions.value,
        placeholder: '请选择岗位'
      }
    },
    {
      key: 'roleIds',
      label: '角色',
      type: 'select',
      props: {
        multiple: true,
        collapseTags: true,
        options: roleSelectOptions.value,
        placeholder: '请选择角色'
      }
    },
    {
      key: 'remark',
      label: '备注',
      type: 'input',
      span: 24,
      props: { type: 'textarea', rows: 3, placeholder: '请输入备注' }
    }
  ])

  const dialogTitle = computed(() => (props.type === 'add' ? '新增用户' : '编辑用户'))

  const normalizeText = (value?: string): string | undefined => {
    const text = value?.trim()
    return text ? text : undefined
  }

  const resetFormData = () => {
    Object.assign(form, createDefaultForm())
  }

  const loadInitPassword = async () => {
    try {
      initPassword.value = await fetchGetConfigKey('sys.user.initPassword')
    } catch {
      initPassword.value = ''
    }
  }

  const loadBaseOptions = async () => {
    const [deptTree, userMeta] = await Promise.all([
      fetchGetDeptTree(),
      fetchGetUserDetail(),
      loadInitPassword()
    ])
    deptOptions.value = deptTree || []
    postOptions.value = userMeta.posts || []
    roleOptions.value = userMeta.roles || []
  }

  const loadEditData = async (userId: number) => {
    const userDetail = await fetchGetUserDetail(userId)
    postOptions.value = userDetail.posts || postOptions.value
    roleOptions.value = userDetail.roles || roleOptions.value

    const user = userDetail.data || {}
    Object.assign(form, {
      userId: user.userId,
      deptId: user.deptId,
      userName: user.userName,
      nickName: user.nickName,
      password: undefined,
      phonenumber: user.phonenumber || user.userPhone,
      email: user.email || user.userEmail,
      sex: (user.sex || '0') as '0' | '1' | '2',
      status: (user.status || '0') as '0' | '1',
      postIds: Array.isArray(userDetail.postIds) ? userDetail.postIds : [],
      roleIds: Array.isArray(userDetail.roleIds) ? userDetail.roleIds : [],
      remark: user.remark
    })
  }

  const initForm = async () => {
    formLoading.value = true
    try {
      resetFormData()
      await loadBaseOptions()

      if (props.type === 'edit') {
        if (typeof props.userId !== 'number') {
          throw new Error('编辑用户时缺少 userId')
        }
        await loadEditData(props.userId)
      } else {
        form.password = initPassword.value || undefined
      }
    } finally {
      formLoading.value = false
    }
  }

  const buildPayload = (): Api.SystemManage.UserPayload => {
    if (props.type === 'edit' && typeof form.userId !== 'number') {
      throw new Error('更新用户时缺少 userId')
    }

    return {
      userId: form.userId,
      deptId: form.deptId,
      userName: normalizeText(form.userName),
      nickName: normalizeText(form.nickName),
      password: props.type === 'add' ? form.password : undefined,
      phonenumber: normalizeText(form.phonenumber),
      email: normalizeText(form.email),
      sex: form.sex,
      status: form.status,
      postIds: form.postIds,
      roleIds: form.roleIds,
      remark: normalizeText(form.remark)
    }
  }

  const handleSubmit = async () => {
    await formRef.value?.validate()
    submitLoading.value = true
    try {
      const payload = buildPayload()
      if (props.type === 'add') {
        await fetchAddUser(payload)
      } else {
        await fetchUpdateUser(payload)
      }
      ElMessage.success(props.type === 'add' ? '新增成功' : '修改成功')
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
      await initForm()
    }
  )
</script>
