# AI Implementation Rules

## 1. Goal
让 AI 在这个项目里稳定地做到三件事：
- 先识别业务属于哪个页面类型
- 再复用已存在模板与组件
- 最后按现有规范交付可测试代码

## 2. Mandatory Inputs (每次生成代码前必须读取)
1. `docs/ai/business-map.yaml`
2. `docs/ai/page-recipes.yaml`
3. `docs/ai/page-guardrail-recipes.md`
4. `docs/ai/component-catalog.yaml`
5. `docs/testing-standards.md`
6. `src/routes/routes.config.ts`
7. `src/infrastructure/auth/permissions.ts`

## 3. Engineering Constraints
- 路由、菜单、权限都走已有 route contract。
- 新页面先复用 `src/pages/templates/*` 与 `src/shared/template-kit/*`。
- 若需求是“从其他项目迁移页面”，优先阅读 `docs/ai/form-migration-rules.md` 或 `docs/ai/list-migration-rules.md`，先做旧新对照清单，再决定是否接入 recipe。
- 页面先按模块拆解（筛选区/内容区/反馈区/权限区），再选组件。
- 标准查询列表页分页必须复用 `src/shared/hooks/use-standard-pagination.ts`，禁止页面内散装实现分页状态。
- 有异步请求必须处理 `loading / empty / error / partial`。
- 表单模式必须遵守 `add / modify / readonly`（见 `src/routes/form-route-contract.ts`）。
- 表单类型必须按 `docs/ai/page-recipes.yaml#formTemplateDecisionMatrix` 判别，禁止拍脑袋选型。
- 默认不新建详情页，优先复用表单 `readonly` 模式；独立详情页需满足特例条件。
- 所有 API 返回结构必须显式定义 TypeScript 类型。
- 任何新增行为都要补对应测试（最少覆盖 happy path + 1 个失败路径）。
- 新建任意测试文件前，必须先读取 `docs/testing-standards.md`，并按其中分层、命名和最小覆盖清单执行。
- 尽量少写死样式值（颜色、背景、边框、阴影）；优先使用主题 token、组件变量或语义 class，以适配 `light/dark/system`。
- 操作列宽度禁止运行时动态推算，必须在开发阶段按按钮文案和数量一次性计算后写成固定值，并在代码注释说明计算过程。
- 列表中的危险操作必须使用 `Popconfirm` 去实现二次确认。
- 动态表单中“上移/下移/删除/编号”操作必须复用统一组件 `sort-action-group`，禁止页面内重复散装实现。
- 复杂字段（如 `Cascader/Tree/Upload/SearchSelect`）默认同构复用，禁止无依据降级为 `Input/普通Select`。
- 重置行为必须是“全状态重置”：除表单字段外，需同步重置复杂组件状态（如树勾选/半勾选、展开态、搜索关键字、临时列表缓存）。
- 初始化加载相关副作用必须保证依赖稳定：传入 hook/controller 的请求函数默认使用稳定引用（如 `useCallback`），避免重复请求与渲染抖动。
- `mode/id` 等关键路由参数校验失败时，必须提供首层可见错误态与恢复动作，禁止静默失败。
- 二级及更深层级页面（非一级列表落地页）必须使用统一页头组件 `PageHeaderWithBack`（定义于 `src/shared/components/form-page-header.tsx`），包含标题与返回 icon，禁止页面内重复手写返回头部。
- 当页面已使用 `PageHeaderWithBack` 承载主标题时，页面主容器 `Card` 不得重复设置同义 `title`；基础表单页与分步表单页必须去掉主 `Card title`。
- 列表页的编辑/表单/详情路由必须使用“列表路径前缀 + 子路径”编排（例如 `.../list/edit`、`.../list/form`），禁止跨级跳到平级路径（例如从 `.../fission-apply-list` 跳到 `.../fission-apply-edit`）；否则会导致左侧菜单高亮失焦。
- 新增或修改跳转时，`navigate/window.open/useCrudFormNavigation` 的目标路径必须与对应列表路由保持同前缀。
- 组件库约束：当前项目为 `antd@6`，禁止产出任何已标记 deprecated 的 API/props；若出现冲突，以 Ant Design v6 迁移指南为准完成替换。
- 代码卫生约束：禁止保留未使用的 import/变量；提交前必须通过 ESLint（包含 `unused-imports` 规则）。

## 4. Design Baseline (Authoritative)
以下规则是本项目 UI/UX 的唯一执行标准。

- 状态反馈必须覆盖 `readonly / loading / empty / error / partial`。
- `readonly` 必须显示“查看模式”状态条，且禁用重置/保存并硬阻断提交。
- `loading` 必须有明确任务文案，不能只放转圈。
- `empty` 必须说明“为什么为空”并提供一个恢复动作。
- `error` 必须提供可执行恢复动作（重试或返回），禁止死路提示。
- `partial` 必须有告警语义和“重载完整数据”动作。
- Query 状态文案必须页面语义化，禁止跨页面复制同一句文案。
- 默认详情展示复用表单 `readonly`；仅当信息结构与编辑结构显著不同时才允许独立详情页。
- 主题必须支持 `light / dark / system`，并使用同一主题上下文。
- 新增样式优先使用 Ant Design token 或语义化 CSS 变量；避免硬编码颜色、背景、边框、阴影。
- 若出现临时硬编码样式，必须在 `TODOS.md` 记录迁移任务。
- 可访问性基线：键盘焦点顺序与视觉顺序一致，状态文案可被屏幕阅读器清晰理解。
- 操作列“更多聚合”场景必须在开发阶段完成宽度重算并固化常量，不得以运行时测量结果控制列宽。
- 反馈语义必须分层：轻量结果用 `message`，高风险/强确认写操作用 `modal`（如删除、发布、不可撤销操作）；同类行为在同页面保持一致。
- 二级及更深层级页面必须展示“标题 + 返回 icon”统一头部，交互与样式以 `PageHeaderWithBack` 为基线。

## 5.1 操作列固定宽度规则（强制）
1. 固定计算口径：
- 4 个汉字 = 56px（14px/字）
- 按钮间距默认 13px（需计入）
- 额外余量默认 +16px（非特殊场景不扩大）
- 宽度上限默认 220px（超过则按 220px 截断）

2. 计算基线：
- 以“所有操作按钮都展示”的最宽组合计算（含权限放开、状态分支命中）
- 使用 `Divider` 分隔时，必须计入分隔占位，不得只按文案估算

3. 代码要求：
- 宽度写成常量（如 `ACTION_COLUMN_WIDTH`），禁止运行时动态推算
- 常量上方必须有注释，明确计算过程与各项像素来源
- 若存在“更多”下拉聚合，聚合后必须重新按上述口径计算固定宽度

## 6. File Placement Convention
- 新业务页面: `src/pages/templates/<domain>/`
- 模板化复用逻辑: `src/shared/template-kit/`
- 页面 API: `src/pages/templates/<domain>/api.ts`
- 路由配置: `src/routes/routes.config.ts`

## 7. Output Contract for AI
AI 在输出实现方案时，必须包含：
1. 业务归类（对应 business domain / recipe）
2. 页面模块划分（至少标出筛选区/内容区/反馈区/权限区中适用项）
3. 表单选型结论（基础/分步/高级）及判别依据
4. 将复用的现有文件列表
5. 将新增或修改的文件列表
6. 测试计划（至少 2 条）
7. 风险点（权限、参数、空态、错误态、主题适配）

## 8. Rejection Rules
如果 AI 方案出现以下任一项，视为不合格并重做：
- 新造一个和 template-kit 重复的控制器
- 忽略权限声明
- 忽略 `mode` 参数校验
- 页面只实现 happy path，没有异常/空态
- 表单类型选择没有给出判别依据
- 出现大量硬编码样式且未考虑深色模式
