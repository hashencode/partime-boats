# AI 开发文档导航

本项目为 React / TypeScript / Rsbuild / Ant Design 6 / TailwindCSS 管理后台。沿用本仓库的页面、路由、权限、接口与记忆规则，不照搬其他后台或 Flutter 项目的交互规范。

## 每次任务先读

1. [.agents/memories/PROFILE.md](../../.agents/memories/PROFILE.md) 与 [ACTIVE.md](../../.agents/memories/ACTIVE.md)，先应用现有项目记忆。
2. [协作与实施规则](collaboration-rules.md)，保留原 AGENTS 中的最小改动、目录创建、默认参数、计划输出与业务默认策略。
3. [项目记忆流程](project-memory.md)，决定哪些结果需要记录；不为文档分层迁移或清理现有记忆。

## 按任务继续阅读

| 任务 | 资料 |
| --- | --- |
| 业务实现 | 按根 [AGENTS.md](../../AGENTS.md) 的 Mandatory Read Order 逐项读取；[ai-rules.md](ai-rules.md) 额外指定的输入同样必须读取 |
| 页面与组件选型 | [业务映射](business-map.yaml)、[页面 recipes](page-recipes.yaml)、[组件目录](component-catalog.yaml)、[页面守卫 recipes](page-guardrail-recipes.md)、[页面骨架映射](page-skeleton-map.md) |
| 页面迁移 | [表单迁移](form-migration-rules.md) 或 [列表迁移](list-migration-rules.md)，先列旧新对照再决定接入方式 |
| 列表列宽与操作 | [真实测量规则](list-column-width-rules.md)、[操作规范](list-action-guidelines.md)，区分非操作列测量与操作列固定计算 |
| 接口与失败处理 | [API 导航](../api/README.md)、具体模块 api.ts 和对应测试 |
| 新建或修改测试 | 先读 [测试标准](../testing-standards.md)，继续遵守已有分层、命名与最小覆盖 |

## 已确认的本项目决策

完整规则以协作规则和 ai-rules 为准。以下决策仍然有效，不能因其他项目采用不同做法而更换：

- 列表新增、编辑、查看默认跳转独立表单页；详情优先复用 readonly，不默认改用 Drawer。
- 页面与 API 文件沿用 `src/pages/templates/<domain>/` 及现有 template-kit、typed route 与权限合同。
- 筛选变更默认不立即查询；API 方法、路径严格依据 `docs/api/api.md` 已核实范围，不根据模板猜测。
- 继续保持 light/dark/system、语义化文案和现有用户指定的字段组件。列宽口径与状态反馈细则不在本次整理中调整。

## 文档分层与验证

`docs/ai/` 保存长期规则和导航；`docs/api/` 保存接口资料；[docs/testing-standards.md](../testing-standards.md) 保持原位；[docs/plans/](../plans/) 保留实施计划和验收记录，原有项目记忆继续留在 `.agents/memories/`。

纯文档任务检查链接、原规则与记录是否保留、diff 是否只含目标文档；不因此运行业务实现流程。代码与行为修改仍须先计划、按现有规则测试，并区分实际接口验证与本地 MSW 验证。
