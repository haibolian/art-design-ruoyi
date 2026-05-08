<template>
  <ElDrawer
    v-model="visible"
    title="公告详情"
    direction="rtl"
    size="50%"
    append-to-body
    @closed="handleClosed"
  >
    <div v-loading="loading" class="notice-detail-drawer__body">
      <div v-if="!detail" class="notice-empty">暂无数据</div>
      <div v-else class="notice-page">
        <div class="notice-type-wrap">
          <span v-if="detail.noticeType === '1'" class="notice-type-tag type-notify">通知</span>
          <span v-else-if="detail.noticeType === '2'" class="notice-type-tag type-announce">公告</span>
          <span v-else class="notice-type-tag type-notify">消息</span>
        </div>

        <h1 class="notice-title">{{ detail.noticeTitle || '-' }}</h1>

        <div class="notice-meta">
          <span class="meta-item">创建者：{{ detail.createBy || '-' }}</span>
          <span class="meta-item">创建时间：{{ detail.createTime || '-' }}</span>
          <span class="meta-item">状态：{{ detail.status === '0' ? '正常' : '关闭' }}</span>
        </div>

        <div class="notice-body">
          <div v-if="hasContent" class="notice-content" v-html="detail.noticeContent" />
          <div v-else class="notice-empty notice-empty--inner">暂无内容</div>
        </div>
      </div>
    </div>
  </ElDrawer>
</template>

<script setup lang="ts">
  import { fetchGetNoticeDetail } from '@/api/system/notice'

  type NoticeListItem = Api.SystemManage.NoticeListItem

  const visible = ref(false)
  const loading = ref(false)
  const detail = ref<NoticeListItem | null>(null)

  const hasContent = computed(() => {
    const content = detail.value?.noticeContent
    return content != null && String(content).trim() !== ''
  })

  const open = async (payload: NoticeListItem | number) => {
    const noticeId = typeof payload === 'number' ? payload : payload.noticeId
    const preset = typeof payload === 'object' ? payload : null

    visible.value = true

    if (preset?.noticeContent) {
      detail.value = preset
      return
    }

    if (typeof noticeId !== 'number') {
      detail.value = null
      return
    }

    loading.value = true
    detail.value = null
    try {
      detail.value = await fetchGetNoticeDetail(noticeId)
    } finally {
      loading.value = false
    }
  }

  const handleClosed = () => {
    detail.value = null
    loading.value = false
  }

  defineExpose({
    open
  })
</script>

<style scoped lang="scss">
  .notice-page {
    max-width: 760px;
    margin: 0 auto;
    padding: 8px 8px 20px;
  }

  .notice-type-wrap {
    margin-bottom: 14px;
  }

  .notice-type-tag {
    display: inline-flex;
    align-items: center;
    padding: 3px 12px;
    border-radius: 2px;
    font-size: 11px;
    font-weight: 700;
  }

  .type-notify {
    background: #fff8e6;
    color: #b7791f;
    border-left: 3px solid #d97706;
  }

  .type-announce {
    background: #e8f5e9;
    color: #276749;
    border-left: 3px solid #38a169;
  }

  .notice-title {
    font-size: 22px;
    font-weight: 700;
    color: #1a202c;
    line-height: 1.45;
    margin: 0 0 16px;
  }

  .notice-meta {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 16px;
    padding: 12px 0;
    border-top: 1px solid #e9ecef;
    border-bottom: 1px solid #e9ecef;
    margin-bottom: 28px;
    font-size: 12px;
    color: #718096;
  }

  .notice-body {
    background: #fff;
    border-radius: 6px;
    padding: 28px 32px;
    box-shadow: 0 1px 4px rgb(0 0 0 / 6%), 0 0 0 1px rgb(0 0 0 / 4%);
    min-height: 120px;
  }

  .notice-content {
    font-size: 14px;
    line-height: 1.85;
    color: #2d3748;
    word-break: break-word;
  }

  .notice-content :deep(p) {
    margin: 0 0 1em;
  }

  .notice-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 120px;
    color: #909399;
  }

  .notice-empty--inner {
    min-height: 0;
    padding: 24px 0;
  }
</style>
