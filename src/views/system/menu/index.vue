<template>
  <div class="art-full-height">
    <ProTable
      :key="tableKey"
      ref="proTableRef"
      row-key="menuId"
      :request="requestMenuList"
      :columns="columns"
      :table-props="tableProps"
      :pagination-options="{ hideOnSinglePage: true }"
      :use-table-options="{ responseAdapter: menuResponseAdapter, onSuccess: handleTableSuccess }"
    >
      <template #toolbar-left>
        <ElSpace wrap>
          <ElButton v-auth="'system:menu:add'" @click="openDialog('add')" v-ripple
            >新增菜单</ElButton
          >
          <ElButton v-auth="'system:menu:edit'" @click="saveSort" v-ripple>保存排序</ElButton>
          <ElButton @click="toggleExpand" v-ripple>
            {{ isExpanded ? '收起' : '展开' }}
          </ElButton>
        </ElSpace>
      </template>
    </ProTable>

    <MenuDialog
      v-model:visible="dialogVisible"
      :mode="dialogMode"
      :menu-id="currentMenuId"
      :parent-id="currentParentId"
      @success="handleDialogSuccess"
    />
  </div>
</template>

<script setup lang="ts">
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import MenuDialog from './modules/menu-dialog.vue'
  import type { ProTableColumn, ProTableExpose } from '@/types/component'
  import { fetchDeleteMenu, fetchGetMenuList, fetchUpdateMenuSort } from '@/api/system/menu'
  import { useAuth } from '@/hooks/core/useAuth'
  import { ElInputNumber, ElTag, ElMessageBox } from 'element-plus'

  defineOptions({ name: 'Menus' })

  type MenuListItem = Api.SystemManage.MenuListItem
  type DialogMode = 'add' | 'edit'
  type TagType = 'primary' | 'success' | 'warning' | 'info' | 'danger'

  const { hasAuth } = useAuth()

  const proTableRef = ref<ProTableExpose<MenuListItem> | null>(null)
  const dialogVisible = ref(false)
  const dialogMode = ref<DialogMode>('add')
  const currentMenuId = ref<number | null>(null)
  const currentParentId = ref(0)
  const isExpanded = ref(false)
  const tableKey = ref(0)
  const originalOrders = ref<Record<number, number | string | undefined>>({})

  const tableProps = computed(() => ({
    stripe: false,
    defaultExpandAll: isExpanded.value,
    treeProps: { children: 'children', hasChildren: 'hasChildren' }
  }))

  const MENU_TYPE_META: Record<string, { text: string; type: TagType }> = {
    M: { text: '目录', type: 'primary' },
    C: { text: '菜单', type: 'success' },
    F: { text: '按钮', type: 'warning' },
    LINK: { text: '外链', type: 'danger' }
  }

  const columns: ProTableColumn<MenuListItem, Api.SystemManage.MenuQueryParams>[] = [
    {
      prop: 'menuName',
      label: '菜单名称',
      minWidth: 240,
      search: {
        props: {
          placeholder: '请输入菜单名称'
        }
      },
      cellRender: (row) =>
        h('span', { class: 'inline-flex items-center gap-1' }, [
          row.icon ? h(ArtSvgIcon, { icon: row.icon, class: 'text-base text-g-700' }) : null,
          h('span', row.menuName || '-')
        ])
    },
    {
      prop: 'menuType',
      label: '类型',
      width: 100,
      cellRender: (row) => {
        const key = row.menuType !== 'F' && row.isFrame === '0' ? 'LINK' : row.menuType || 'M'
        const meta = MENU_TYPE_META[key] || MENU_TYPE_META.M
        return h(ElTag, { type: meta.type }, () => meta.text)
      }
    },
    {
      prop: 'orderNum',
      label: '排序',
      width: 120,
      cellRender: (row) => {
        if (!hasAuth('system:menu:edit')) {
          return h('span', row.orderNum != null ? String(row.orderNum) : '-')
        }

        return h(ElInputNumber, {
          modelValue: Number(row.orderNum ?? 0),
          min: 0,
          controlsPosition: 'right',
          style: { width: '88px' },
          'onUpdate:modelValue': (value: number | undefined) => {
            row.orderNum = value ?? 0
          }
        })
      }
    },
    {
      prop: 'perms',
      label: '权限标识',
      minWidth: 180,
      showOverflowTooltip: true,
      formatter: (row) => row.perms || '-'
    },
    {
      prop: 'component',
      label: '组件路径',
      minWidth: 180,
      showOverflowTooltip: true,
      formatter: (row) => row.component || '-'
    },
    {
      prop: 'status',
      label: '状态',
      width: 100,
      dictType: 'sys_normal_disable',
      valueType: 'dict-tag',
      search: {
        props: {
          placeholder: '请选择状态'
        }
      }
    },
    {
      prop: 'operation',
      label: '操作',
      width: 180,
      fixed: 'right',
      align: 'center',
      cellRender: (row) => {
        const actions = []

        if (hasAuth('system:menu:edit')) {
          actions.push(h(ArtButtonTable, { type: 'edit', onClick: () => openDialog('edit', row) }))
        }

        if (hasAuth('system:menu:add') && row.menuType !== 'F') {
          actions.push(h(ArtButtonTable, { type: 'add', onClick: () => openDialog('add', row) }))
        }

        if (hasAuth('system:menu:remove')) {
          actions.push(h(ArtButtonTable, { type: 'delete', onClick: () => deleteMenu(row) }))
        }

        return actions.length ? h('div', { style: 'text-align: right' }, actions) : '-'
      }
    }
  ]

  const assertMenuList = (list: MenuListItem[]): MenuListItem[] => {
    if (!Array.isArray(list)) {
      throw new Error('菜单列表接口返回值不符合约定：应为数组')
    }
    return list
  }

  const buildMenuTree = (list: MenuListItem[]): MenuListItem[] => {
    const nodeMap = new Map<number, MenuListItem>()
    const roots: MenuListItem[] = []

    list.forEach((item) => {
      if (typeof item.menuId !== 'number') {
        throw new Error('菜单列表接口返回值不符合约定：menuId 必须为数字')
      }
      nodeMap.set(item.menuId, { ...item, children: [] })
    })

    list.forEach((item) => {
      const node = nodeMap.get(item.menuId!)
      const parentId = Number(item.parentId ?? 0)
      if (parentId !== 0 && nodeMap.has(parentId)) {
        nodeMap.get(parentId)!.children!.push(node!)
      } else {
        roots.push(node!)
      }
    })

    return roots
  }

  const recordOriginalOrders = (list: MenuListItem[]) => {
    const nextOrders: Record<number, number | string | undefined> = {}

    const collect = (nodes: MenuListItem[]) => {
      nodes.forEach((item) => {
        if (typeof item.menuId === 'number') {
          nextOrders[item.menuId] = item.orderNum
        }
        if (Array.isArray(item.children) && item.children.length > 0) {
          collect(item.children)
        }
      })
    }

    collect(list)
    originalOrders.value = nextOrders
  }

  const menuResponseAdapter = (response: MenuListItem[]) => {
    const tree = buildMenuTree(assertMenuList(response))
    return {
      records: tree,
      total: 0,
      current: 1,
      size: tree.length || 10
    }
  }

  const handleTableSuccess = (data: MenuListItem[]) => {
    recordOriginalOrders(data)
  }

  const requestMenuList = (params: Record<string, any>) => {
    const nextParams: Api.SystemManage.MenuQueryParams = {}
    if (params.menuName) {
      nextParams.menuName = params.menuName
    }
    if (params.status) {
      nextParams.status = params.status
    }
    return fetchGetMenuList(nextParams)
  }

  const getCurrentRows = () => {
    return proTableRef.value?.data.value || []
  }

  const openDialog = (mode: DialogMode, row?: MenuListItem) => {
    dialogMode.value = mode
    currentMenuId.value = mode === 'edit' ? (row?.menuId ?? null) : null
    currentParentId.value = mode === 'add' ? (row?.menuId ?? 0) : Number(row?.parentId ?? 0)
    dialogVisible.value = true
  }

  const deleteMenu = async (row: MenuListItem) => {
    if (typeof row.menuId !== 'number') {
      throw new Error('菜单ID缺失，无法删除')
    }

    try {
      await ElMessageBox.confirm(`确认删除菜单 "${row.menuName}" 吗？`, '删除确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      await fetchDeleteMenu(row.menuId)
      ElMessage.success('删除成功')
      await proTableRef.value?.refreshData()
    } catch (error) {
      if (error === 'cancel' || error === 'close') return
      throw error
    }
  }

  const saveSort = async () => {
    const changedMenuIds: number[] = []
    const changedOrderNums: Array<number | string | undefined> = []

    const collectChanged = (list: MenuListItem[]) => {
      list.forEach((item) => {
        if (
          typeof item.menuId === 'number' &&
          String(originalOrders.value[item.menuId]) !== String(item.orderNum)
        ) {
          changedMenuIds.push(item.menuId)
          changedOrderNums.push(item.orderNum)
        }
        if (Array.isArray(item.children) && item.children.length > 0) {
          collectChanged(item.children)
        }
      })
    }

    collectChanged(getCurrentRows())

    if (changedMenuIds.length === 0) {
      ElMessage.warning('未检测到排序修改')
      return
    }

    await fetchUpdateMenuSort({
      menuIds: changedMenuIds.join(','),
      orderNums: changedOrderNums.map((item) => String(item ?? 0)).join(',')
    })
    ElMessage.success('排序保存成功')
    recordOriginalOrders(getCurrentRows())
  }

  const handleDialogSuccess = async () => {
    dialogVisible.value = false
    await proTableRef.value?.refreshData()
  }

  const toggleExpand = () => {
    isExpanded.value = !isExpanded.value
    tableKey.value += 1
  }
</script>
