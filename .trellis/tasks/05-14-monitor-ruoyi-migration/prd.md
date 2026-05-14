# Monitor 模块逐个核对并迁移 Ruoyi-vue3 业务逻辑

## Goal

逐个检查 `src/views/monitor` 下的监控模块，确认是否已经完整迁移 `~/Code/Vue3/RuoYi-Vue3/src/views/monitor` 对应模块的业务逻辑；若未完成，则补齐迁移。迁移时遵循当前项目约束：列表优先使用 `ProTable`，表单优先使用 `ArtForm`，API 不再集中放在 `src/api/monitor.ts`，而是拆分到独立的 `src/api/system/*` 文件中。

## What I already know

* 当前待检查模块为：
  * `cache`
  * `druid`
  * `job`
  * `logininfor`
  * `online`
  * `operlog`
  * `server`
* 参考项目对应模块为：
  * `cache`
  * `druid`
  * `job`（含 `detail.vue`、`index.vue`、`log.vue`）
  * `logininfor`
  * `online`
  * `operlog`（含 `detail.vue`、`index.vue`）
  * `server`
* 当前项目 `monitor` 页面已经部分使用 `ProTable` / `ArtForm`：
  * `job/index.vue` 已使用 `ProTable` 和 `ArtForm`
  * `job/log.vue`、`logininfor/index.vue`、`operlog/index.vue` 已使用 `ProTable`
* 当前项目监控模块 API 仍集中在 `src/api/monitor.ts`，与本次要求不符，后续迁移需要按模块拆分到 `src/api/system/*`
* 现有系统模块已经有拆分 API 的先例，如 `src/api/system/menu.ts`、`src/api/system/notice.ts`

## Assumptions (temporary)

* “迁移完成”优先指业务逻辑、接口契约、字典/权限/动作链路与参考项目对齐，不要求机械复制参考项目的页面拆分方式
* 若当前项目已有更适配的交互形态（例如详情弹窗）且不影响业务逻辑完整性，则可保留
* 本轮工作按模块逐个推进，不一次性完成整个 `monitor`

## Open Questions

* `job` 和 `operlog` 是否必须像参考项目一样拆成独立详情页，还是允许保留当前弹窗详情，只补齐业务逻辑与接口能力

## Requirements (evolving)

* 逐个盘点 `src/views/monitor` 模块与参考项目的业务逻辑差异
* 每次只处理一个模块，检查后立即补齐缺失项
* 列表检索与表格交互使用 `ProTable`，避免新增类似 `user-search` 的独立检索组件
* 表单使用 `ArtForm`，仅在 `ArtForm` 明确无法覆盖时才允许直接使用 `el-form`
* API 按模块拆分到独立的 `src/api/system/*` 文件中
* 保持与 RuoYi 后端接口契约一致，不引入静默 fallback 或 mock

## Acceptance Criteria (evolving)

* [ ] 明确 `monitor` 模块逐个处理的顺序与“迁移完成”的判定口径
* [ ] 完成第一个目标模块的差异核对
* [ ] 若存在缺失，完成该模块的业务逻辑迁移
* [ ] 对该模块涉及的 API 完成拆分并接入页面
* [ ] 对该模块执行必要的验证（至少包含受影响范围的 lint/type-check 或等效验证）

## Definition of Done (team quality bar)

* Tests added/updated (unit/integration where appropriate)
* Lint / typecheck / CI green
* Docs/notes updated if behavior changes
* Rollout/rollback considered if risky

## Out of Scope (explicit)

* 一次性重做整个 `monitor` 目录的所有模块
* 无业务价值的页面结构机械对齐
* 与 `monitor` 无关的系统模块重构

## Technical Notes

* 当前任务目录：`.trellis/tasks/05-14-monitor-ruoyi-migration/`
* 当前项目监控 API 入口：`src/api/monitor.ts`
* 当前项目监控视图目录：`src/views/monitor`
* 参考项目监控视图目录：`~/Code/Vue3/RuoYi-Vue3/src/views/monitor`
