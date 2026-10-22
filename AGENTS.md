# AGENTS Rules

## Task Entry

- 每次任务先读 [.agents/memories/PROFILE.md](.agents/memories/PROFILE.md) 和 [ACTIVE.md](.agents/memories/ACTIVE.md)，在分析需求前应用项目记忆。
- 再读 [AI 文档导航](docs/ai/README.md)、[协作与实施规则](docs/ai/collaboration-rules.md) 和 [项目记忆流程](docs/ai/project-memory.md)；迁出的原有规则与引用资料仍须遵守。
- 新增仓库根目录下的顶层文件夹前必须先取得用户确认；默认使用现有目录与领域内就近组织。
- 业务实现先输出计划，遵守 [ai-rules.md](docs/ai/ai-rules.md) 及协作规则的完整输出合同；保留原页面跳转、主题、列宽和接口约束。

## Mandatory Read Order (before any business implementation)

1. `docs/ai/ai-rules.md`
2. `docs/ai/business-map.yaml`
3. `docs/ai/page-recipes.yaml`
4. `docs/ai/component-catalog.yaml`
5. `docs/ai/list-column-width-rules.md`
6. `docs/testing-standards.md`
7. `src/routes/routes.config.ts`
8. `src/infrastructure/auth/permissions.ts`

接口资料见 [API 导航](docs/api/README.md)，测试要求见 [测试标准](docs/testing-standards.md)，原计划与验收继续保留在 docs/plans/。
