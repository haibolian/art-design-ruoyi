<template>
  <div class="profile-page art-full-height">
    <div class="profile-layout">
      <ElCard class="profile-card" shadow="never">
        <template #header>个人信息</template>
        <div class="profile-avatar">
          <ElUpload
            action="#"
            accept="image/*"
            :show-file-list="false"
            :http-request="handleAvatarUpload"
            :before-upload="beforeAvatarUpload"
          >
            <img :src="avatarUrl" alt="avatar" />
          </ElUpload>
        </div>
        <div class="profile-info">
          <div>
            <ArtSvgIcon icon="ri:user-3-line" />
            <span>用户名称</span>
            <strong>{{ user.userName || '-' }}</strong>
          </div>
          <div>
            <ArtSvgIcon icon="ri:phone-line" />
            <span>手机号码</span>
            <strong>{{ user.phonenumber || '-' }}</strong>
          </div>
          <div>
            <ArtSvgIcon icon="ri:mail-line" />
            <span>用户邮箱</span>
            <strong>{{ user.email || '-' }}</strong>
          </div>
          <div>
            <ArtSvgIcon icon="ri:node-tree" />
            <span>所属部门</span>
            <strong>{{ deptAndPost }}</strong>
          </div>
          <div>
            <ArtSvgIcon icon="ri:shield-user-line" />
            <span>所属角色</span>
            <strong>{{ roleGroup || '-' }}</strong>
          </div>
          <div>
            <ArtSvgIcon icon="ri:calendar-line" />
            <span>创建日期</span>
            <strong>{{ user.createTime || '-' }}</strong>
          </div>
        </div>
      </ElCard>

      <ElCard class="profile-main" shadow="never">
        <template #header>基本资料</template>
        <ElTabs v-model="activeTab">
          <ElTabPane label="基本资料" name="userinfo">
            <ArtForm
              ref="infoFormRef"
              v-model="infoForm"
              :items="infoFormItems"
              :rules="infoRules"
              :span="12"
              :show-reset="false"
              :show-submit="false"
              label-width="80px"
              v-loading="loading"
            />
            <div class="form-actions">
              <ElButton type="primary" :loading="infoSubmitting" @click="submitInfo">
                保存
              </ElButton>
            </div>
          </ElTabPane>

          <ElTabPane label="修改密码" name="resetPwd">
            <ArtForm
              ref="pwdFormRef"
              v-model="pwdForm"
              :items="pwdFormItems"
              :rules="pwdRules"
              :span="24"
              :show-reset="false"
              :show-submit="false"
              label-width="90px"
            />
            <div class="form-actions">
              <ElButton type="primary" :loading="pwdSubmitting" @click="submitPassword">
                保存
              </ElButton>
            </div>
          </ElTabPane>
        </ElTabs>
      </ElCard>
    </div>
  </div>
</template>

<script setup lang="ts">
  import defaultAvatar from '@imgs/user/avatar.webp'
  import ArtForm, { type FormItem } from '@/components/core/forms/art-form/index.vue'
  import {
    fetchGetUserProfile,
    fetchUpdateUserProfile,
    fetchUpdateUserPwd,
    fetchUploadAvatar
  } from '@/api/system/user'
  import { useUserStore } from '@/store/modules/user'
  import { DICT_TYPE } from '@/types'
  import type { FormItemRule, FormRules, UploadProps, UploadRequestOptions } from 'element-plus'

  defineOptions({ name: 'UserCenter' })

  type UserListItem = Api.SystemManage.UserListItem

  const route = useRoute()
  const userStore = useUserStore()
  const loading = ref(false)
  const infoSubmitting = ref(false)
  const pwdSubmitting = ref(false)
  const activeTab = ref('userinfo')
  const user = ref<UserListItem>({})
  const roleGroup = ref('')
  const postGroup = ref('')
  const infoFormRef = ref<InstanceType<typeof ArtForm>>()
  const pwdFormRef = ref<InstanceType<typeof ArtForm>>()

  const infoForm = reactive<Api.SystemManage.UserPayload>({
    nickName: undefined,
    phonenumber: undefined,
    email: undefined,
    sex: '0'
  })

  const pwdForm = reactive({
    oldPassword: undefined as string | undefined,
    newPassword: undefined as string | undefined,
    confirmPassword: undefined as string | undefined
  })

  const deptAndPost = computed(() => {
    const deptName = user.value.dept?.deptName
    return [deptName, postGroup.value].filter(Boolean).join(' / ') || '-'
  })

  const avatarUrl = computed(() => {
    const avatar = user.value.avatar || userStore.getUserInfo.avatar
    if (!avatar) return defaultAvatar
    if (/^(https?:|data:|blob:)/.test(avatar)) return avatar
    if (avatar.startsWith('/')) return `${import.meta.env.VITE_API_URL}${avatar}`
    return avatar
  })

  const equalToPassword: NonNullable<FormItemRule['validator']> = (_rule, value, callback) => {
    if (pwdForm.newPassword !== value) {
      callback(new Error('两次输入的密码不一致'))
      return
    }
    callback()
  }

  const validateNewPassword: NonNullable<FormItemRule['validator']> = (_rule, value, callback) => {
    const password = typeof value === 'string' ? value : ''
    if (!password) {
      callback(new Error('新密码不能为空'))
      return
    }
    if (password.length < 5 || password.length > 20) {
      callback(new Error('新密码长度必须介于 5 和 20 之间'))
      return
    }
    if (/<|>|"|'|\||\\/.test(password)) {
      callback(new Error('不能包含非法字符：< > " \' \\ |'))
      return
    }
    callback()
  }

  const infoRules: FormRules<Api.SystemManage.UserPayload> = {
    nickName: [{ required: true, message: '用户昵称不能为空', trigger: 'blur' }],
    email: [
      { required: true, message: '邮箱地址不能为空', trigger: 'blur' },
      { type: 'email', message: '请输入正确的邮箱地址', trigger: ['blur', 'change'] }
    ],
    phonenumber: [
      { required: true, message: '手机号码不能为空', trigger: 'blur' },
      {
        pattern: /^1[3|4|5|6|7|8|9][0-9]\d{8}$/,
        message: '请输入正确的手机号码',
        trigger: 'blur'
      }
    ]
  }

  const pwdRules: FormRules<typeof pwdForm> = {
    oldPassword: [{ required: true, message: '旧密码不能为空', trigger: 'blur' }],
    newPassword: [{ validator: validateNewPassword, trigger: 'blur' }],
    confirmPassword: [
      { required: true, message: '确认密码不能为空', trigger: 'blur' },
      { validator: equalToPassword, trigger: 'blur' }
    ]
  }

  const infoFormItems = computed<FormItem[]>(() => [
    {
      key: 'nickName',
      label: '用户昵称',
      type: 'input',
      props: { maxlength: 30, placeholder: '请输入用户昵称' }
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
      key: 'sex',
      label: '性别',
      type: 'dict-radio-group',
      props: { dictType: DICT_TYPE.USER_SEX }
    }
  ])

  const pwdFormItems = computed<FormItem[]>(() => [
    {
      key: 'oldPassword',
      label: '旧密码',
      type: 'input',
      props: { type: 'password', showPassword: true, placeholder: '请输入旧密码' }
    },
    {
      key: 'newPassword',
      label: '新密码',
      type: 'input',
      props: { type: 'password', showPassword: true, placeholder: '请输入新密码' }
    },
    {
      key: 'confirmPassword',
      label: '确认密码',
      type: 'input',
      props: { type: 'password', showPassword: true, placeholder: '请确认新密码' }
    }
  ])

  const syncUserStore = (patch: Partial<Api.Auth.UserInfo>) => {
    userStore.setUserInfo({
      ...userStore.getUserInfo,
      ...patch,
      roles: userStore.getUserInfo.roles || [],
      permissions: userStore.getUserInfo.permissions || []
    } as Api.Auth.UserInfo)
  }

  const fillInfoForm = () => {
    Object.assign(infoForm, {
      nickName: user.value.nickName,
      phonenumber: user.value.phonenumber,
      email: user.value.email,
      sex: user.value.sex || '0'
    })
  }

  const loadProfile = async () => {
    loading.value = true
    try {
      const response = await fetchGetUserProfile()
      user.value = response.data || {}
      roleGroup.value = String(response.roleGroup || '')
      postGroup.value = String(response.postGroup || '')
      fillInfoForm()
    } finally {
      loading.value = false
    }
  }

  const submitInfo = async () => {
    await infoFormRef.value?.validate()
    infoSubmitting.value = true
    try {
      await fetchUpdateUserProfile({ ...infoForm })
      Object.assign(user.value, { ...infoForm })
      syncUserStore({
        nickName: infoForm.nickName,
        email: infoForm.email
      })
      ElMessage.success('修改成功')
    } finally {
      infoSubmitting.value = false
    }
  }

  const submitPassword = async () => {
    await pwdFormRef.value?.validate()
    if (!pwdForm.oldPassword || !pwdForm.newPassword) return

    pwdSubmitting.value = true
    try {
      await fetchUpdateUserPwd(pwdForm.oldPassword, pwdForm.newPassword)
      Object.assign(pwdForm, {
        oldPassword: undefined,
        newPassword: undefined,
        confirmPassword: undefined
      })
      pwdFormRef.value?.ref?.resetFields()
      ElMessage.success('修改成功')
    } finally {
      pwdSubmitting.value = false
    }
  }

  const beforeAvatarUpload: UploadProps['beforeUpload'] = (file) => {
    const isImage = file.type.startsWith('image/')
    if (!isImage) {
      ElMessage.error('文件格式错误，请上传图片类型文件')
    }
    return isImage
  }

  const handleAvatarUpload = async (options: UploadRequestOptions) => {
    const formData = new FormData()
    formData.append('avatarfile', options.file)
    const response = await fetchUploadAvatar(formData)
    if (response.imgUrl) {
      user.value.avatar = response.imgUrl
      syncUserStore({ avatar: response.imgUrl })
    }
    ElMessage.success('修改成功')
  }

  watch(
    () => route.params.activeTab,
    (tab) => {
      activeTab.value = typeof tab === 'string' && tab ? tab : 'userinfo'
    },
    { immediate: true }
  )

  onMounted(() => {
    void loadProfile()
  })
</script>

<style scoped>
  .profile-layout {
    display: grid;
    grid-template-columns: 320px minmax(0, 1fr);
    gap: 16px;
    height: 100%;
    min-height: 0;
  }

  .profile-card,
  .profile-main {
    min-height: 0;
  }

  .profile-avatar {
    display: flex;
    justify-content: center;
    margin-bottom: 24px;
  }

  .profile-avatar img {
    width: 112px;
    height: 112px;
    object-fit: cover;
    border-radius: 50%;
    cursor: pointer;
  }

  .profile-info {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .profile-info > div {
    display: grid;
    grid-template-columns: 20px 72px minmax(0, 1fr);
    gap: 8px;
    align-items: center;
    font-size: 14px;
  }

  .profile-info strong {
    overflow: hidden;
    font-weight: 400;
    text-align: right;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    padding: 0 16px 16px;
  }

  @media (max-width: 900px) {
    .profile-layout {
      grid-template-columns: 1fr;
      height: auto;
    }
  }
</style>
