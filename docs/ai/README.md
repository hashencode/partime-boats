# AI 开发文档导航

核心开发规范统一在 [development-rules.md](development-rules.md) 维护。先遵守根 AGENTS 的授权边界，再读取该文件及本导航指定的适用资料；本导航不另维护第二份规则正文。

## 统一文档入口

[文档总导航](../README.md) 说明目录职责、命名和保留的项目例外；[开发规则](development-rules.md) 承接本项目持续约束。原必读顺序与各场景权威链继续按下文执行，文档整理不改变原验收状态。

本项目为 React / TypeScript / Rsbuild / Ant Design 6 / TailwindCSS 管理后台。沿用本仓库的页面、路由、权限、接口与记忆规则，不照搬其他后台或 Flutter 项目的交互规范。

## 每次任务先读

1. 根 AGENTS、本导航与核心开发规范，按本次任务范围选择资料。
2. [协作与实施规则](development-rules.md)，保留原 AGENTS 中的最小改动、目录创建、默认参数、计划输出与业务默认策略。
3. 核心规范的“经验与记忆维护”章节；存量有效约束按相关任务核对，清理须另获具体批次确认。

## 按任务继续阅读

| 任务 | 资料 |
| --- | --- |
| 业务实现 | 按根 [AGENTS.md](../../AGENTS.md) 的 Mandatory Read Order 逐项读取；[development-rules.md](development-rules.md) 额外指定的输入同样必须读取 |
| 页面与组件选型 | [业务映射](business-map.yaml)、[页面 recipes](page-recipes.yaml)、[组件目录](component-catalog.yaml)、[页面守卫 recipes](page-guardrail-recipes.md)、[页面骨架映射](page-skeleton-map.md) |
| 页面迁移 | [表单迁移](form-migration-rules.md) 或 [列表迁移](list-migration-rules.md)，先列旧新对照再决定接入方式 |
| 列表列宽与操作 | [真实测量规则](list-column-width-rules.md)、[操作规范](list-action-guidelines.md)，区分非操作列测量与操作列固定计算 |
| 接口与失败处理 | [API 导航](../api/README.md)、具体模块 api.ts 和对应测试 |
| 新建或修改测试 | 先读 [测试标准](../testing-standards.md)，继续遵守已有分层、命名与最小覆盖 |

## 已确认的本项目决策

完整规则以 [development-rules.md](development-rules.md) 为准。以下决策仍然有效，不能因其他项目采用不同做法而更换：

- 列表新增、编辑、查看默认跳转独立表单页；详情优先复用 readonly，不默认改用 Drawer。
- 页面与 API 文件沿用 `src/pages/templates/<domain>/` 及现有 template-kit、typed route 与权限合同。
- 筛选变更默认不立即查询；API 方法、路径严格依据 `docs/api/api.md` 已核实范围，不根据模板猜测。
- 继续保持 light/dark/system、语义化文案和现有用户指定的字段组件。列宽口径与状态反馈细则不在本次整理中调整。

## 文档分层与验证

`docs/ai/` 保存长期规则和导航；`docs/api/` 保存接口资料；[docs/testing-standards.md](../testing-standards.md) 保持原位；[docs/plans/](../plans/) 保留实施计划和验收记录，原有项目记忆继续留在 `.agents/memories/`。

纯文档任务检查链接、原规则与记录是否保留、diff 是否只含目标文档；不因此运行业务实现流程。代码与行为修改仍须先计划、按现有规则测试，并区分实际接口验证与本地 MSW 验证。

## 经验与记忆入口

[经验与记忆维护](development-rules.md#经验与记忆维护) 统一规定按需复核、候选确认、正式承接与去重；本项目不设置定时复核。

2026-10-22 本轮存量整理已完成，见 [结项记录](../plans/2026-10-22-memory-cleanup-proposals.md)。保留项均已审查结项，不再列为“下一批待清理”；只有相关新证据或用户明确的新任务才复核受影响条目。

目录位置见 [Agent 工作目录](../../.agents/README.md)；候选与存量入口见 [.agents/memories/README.md](../../.agents/memories/README.md)，临时材料放在 `.agents/tmp/`。
