# 记忆与经验清理结项记录

结项日期：2026-10-22。状态：**本轮清理已结束；保留项已审查结项，不再列为下一批待清理。仅修改文档，未提交推送。**

项目：`partime-boats`；调查分支：`main`；调查 HEAD：`c1c0f1d6f9a72e3d99226d3b182d37eb86b4fee0`。来源以本地实际文件为准，已有其他任务改动不在本轮清理授权内。

## 本轮收尾结果

本轮按用户确认的完整收尾范围执行，先补齐正式承接，再去重或修正来源。原“工具笔记／环境快照”一律删除的宽泛建议不再采用；真实经验、原日期和当次验证边界保留。

本次核对 54 个资料单元（含身份、偏好、真实经验、重复小节、分类说明与旧流程，不代表独立故障次数）：已审查保留 28；已去重 11；已正式承接后去重 6；已修正并保留 6；已合并同主题历史记录 1；已合并测试入口说明 1；已收口导航 1。

第一批范围与删除前原文见 [第一批执行记录](2026-10-22-2030-memory-cleanup-batch-1-plan.md)。下方执行前调查仅作追溯，不再构成待执行队列。

- 保留项均已完成本轮判断，原运行结果没有重新复测不意味着恢复为待决；不得无新证据反复提出。
- PROFILE / ACTIVE 中未完整承接的偏好和约束先补入现有核心规范；原文件路径保留必要身份或短导航。
- 现行规则、正式计划及明确测试已完整覆盖的副本才去重；相关原文与承接位置保存在本记录。
- ERRORS 的历史事故保留，测试入口等同主题记录合并时保全各来源日期；历史绕行不作长期免检。
- 旧 project-memory 已收口为导航；记录质量要求、PC的运行时配置与凭据禁令均先正式承接。
- 不修改业务代码、组件库、脚本、依赖、Git分支或既有验收计划；不运行构建、业务测试、浏览器或真实请求；不设置定时复核。

### 已保全的范围与实现差异

- 原18条错误的事故、日期与验证范围均保留；两条同根因Rstest错误与一条经验合并，三个来源日期不作三次复发计数。
- 历史类型／Lint／超时记录只代表当次范围，后续类型声明、标准build和2026-10-21验收不抹去旧证据，也不产生长期免检。
- API文档现为部分契约；虚拟滚动经验只在显式启用时适用；回调、队列作用域及tips/log说明均已按当前机制修正。
- 工具栏“右对齐”与当前实现仍有差异；单条作废有状态拦截，批量处理不同。保留经验及具体差异，本轮不改业务，也不将这些差异变为下一批文档清理。
- MSK的当前页/选中项与订舱的筛选全量不能混同；服务端log完整语义未由本轮验证。

## 原待决项的最终结论

以下条目全部已结项；“保留”是完成判断，不是等待新一批清理。

| 原ID | 最终结果 |
| --- | --- |
| `ACTIVE-009` | 与核心规范逐字重复，已去重 |
| `ERRORS-021` | 已保留历史并修正API文档现状 |
| `LEARNINGS-010` | 已审查保留字体路径解析原因 |
| `LEARNINGS-011` | 已审查保留Form命名与motion经验 |
| `LEARNINGS-018` | 已审查保留复杂字段联动条件 |
| `LEARNINGS-019` | 正式规范完整承接全状态重置，已去重 |
| `LEARNINGS-020` | 已审查保留初始化与条件加载组织经验 |
| `LEARNINGS-021` | 已审查保留枚举单一来源原因 |
| `LEARNINGS-022` | 已审查保留工具栏约束；记录右对齐实现差异 |
| `LEARNINGS-027` | 已修正为按业务作用域复用现有队列的条件建议 |
| `LEARNINGS-030` | 已审查保留局部DOM查询原因 |

## 全量逐项结果

位置为本次收尾执行前的行号，仅供追溯；当前内容以存续正文为准。

| 来源位置 | 原主题或内容 | 结果 | 存续承接 |
| --- | --- | --- | --- |
| [.agents/memories/PROFILE.md](../../.agents/memories/PROFILE.md) L5 | Name: `partime-boats` | 已审查保留 | [.agents/memories/PROFILE.md](../../.agents/memories/PROFILE.md) |
| [.agents/memories/PROFILE.md](../../.agents/memories/PROFILE.md) L6 | Stack: React + TypeScript + Rsbuild + Ant Design + TailwindCSS | 已去重 | [docs/ai/development-rules.md](../../docs/ai/development-rules.md)、[README.md](../../README.md) |
| [.agents/memories/PROFILE.md](../../.agents/memories/PROFILE.md) L10 | Prefer practical, low-latency solutions | 已正式承接后去重 | [docs/ai/development-rules.md](../../docs/ai/development-rules.md) |
| [.agents/memories/PROFILE.md](../../.agents/memories/PROFILE.md) L11 | Prefer minimal, scoped changes over broad refactors | 已去重 | [docs/ai/development-rules.md](../../docs/ai/development-rules.md) |
| [.agents/memories/PROFILE.md](../../.agents/memories/PROFILE.md) L15 | Keep changes scoped and directly actionable | 已正式承接后去重 | [docs/ai/development-rules.md](../../docs/ai/development-rules.md) |
| [.agents/memories/PROFILE.md](../../.agents/memories/PROFILE.md) L16 | Preserve existing theme structure unless new variables are required | 已正式承接后去重 | [docs/ai/development-rules.md](../../docs/ai/development-rules.md) |
| [.agents/memories/ACTIVE.md](../../.agents/memories/ACTIVE.md) L5 | 接口策略：方法与路径严格以 `docs/api/api.md` 为准，不按模板臆断接口。 | 已去重 | [docs/ai/development-rules.md](../../docs/ai/development-rules.md) |
| [.agents/memories/ERRORS.md](../../.agents/memories/ERRORS.md) L9 | 2026-04-28（ai-tools）：`bun run -s <script>` 在当前 Bun 版本不可用，会报 `Invalid Argument '-s'`；改用 `bun run <script>` 或 `bun run --silent <script>`。 | 已审查保留 | [.agents/memories/ERRORS.md](../../.agents/memories/ERRORS.md) |
| [.agents/memories/ERRORS.md](../../.agents/memories/ERRORS.md) L10 | 2026-04-30（gmxgy-admin-new迁移分析）：终端无 `python` 命令，脚本统计会直接失败（`command not found: python`）-> 运行环境未提供 python 别名 -> 统一改用 `node - <<'NODE'` 执行临时分析脚本。 | 已审查保留 | [.agents/memories/ERRORS.md](../../.agents/memories/ERRORS.md) |
| [.agents/memories/ERRORS.md](../../.agents/memories/ERRORS.md) L11 | 2026-04-30（auth-route-guard测试）：组件在测试中报 `React is not defined` -> 文件使用 JSX 但未导入 React，且当前测试链路仍依赖旧 JSX 运行时兼容 -> 在组件文件补 `import React from 'react'`（并 `void React`）后恢复。 | 已审查保留 | [.agents/memories/ERRORS.md](../../.agents/memories/ERRORS.md) |
| [.agents/memories/ERRORS.md](../../.agents/memories/ERRORS.md) L12 | 2026-05-06: 在本项目运行单测应使用 `bun run test <files>`（走 rstest/jsdom），直接 `bun test <file>` 会落到 bun 默认环境导致 `window is not defined`。 | 已修正并保留 | [docs/testing-standards.md](../../docs/testing-standards.md) |
| [.agents/memories/ERRORS.md](../../.agents/memories/ERRORS.md) L13 | 2026-05-09（基础端口列表迁移）：全量 `bun run tsc -p tsconfig.app.json --noEmit` 会被仓库历史问题拦住：`ImportMetaEnv.PUBLIC_API_BASE` 未声明、`js-export-excel` 缺少类型、部分旧测试 Promise 类型不匹配 -> 本次页面验证改为“新增文件定向 ESLint + 定向 rstest”，避免把历史噪音误判为本次回归。 | 已审查保留 | [.agents/memories/ERRORS.md](../../.agents/memories/ERRORS.md) |
| [.agents/memories/ERRORS.md](../../.agents/memories/ERRORS.md) L14 | 2026-05-09（codex-admin-quick-start）：运行 `bunx eslint` 可能直接报 `Cannot find package 'eslint-plugin-unused-imports'` -> 仓库本地 ESLint 依赖未装全 -> 先用定向 rstest 验证代码逻辑，静态检查需补齐依赖后再跑。 | 已审查保留 | [.agents/memories/ERRORS.md](../../.agents/memories/ERRORS.md) |
| [.agents/memories/ERRORS.md](../../.agents/memories/ERRORS.md) L15 | 2026-05-10（提醒列表迁移）：全量 `bunx tsc -b --pretty false` 仍会被仓库既有类型问题拦住，且 `js-export-excel` 在多个列表页都缺少声明文件 -> 当前迁移验证优先使用“定向 rstest + 定向 eslint”，不要把全量类型红灯误判为本次改动回归。 | 已审查保留 | [.agents/memories/ERRORS.md](../../.agents/memories/ERRORS.md) |
| [.agents/memories/ERRORS.md](../../.agents/memories/ERRORS.md) L16 | 2026-05-13（MSK/订舱批量操作）：在本项目跑前端单测应使用 `bun run test <file>`，直接 `bun test <file>` 会绕过 rstest 的 jsdom 环境，触发 `window is not defined` 或浏览器依赖模块初始化失败。 | 已合并同主题历史记录 | [.agents/memories/ERRORS.md](../../.agents/memories/ERRORS.md)、[docs/testing-standards.md](../../docs/testing-standards.md) |
| [.agents/memories/ERRORS.md](../../.agents/memories/ERRORS.md) L17 | 2026-05-13（MSK列表导出）：`js-export-excel` 顶层静态导入会在测试环境因 `document` 缺失直接报错 -> 改为点击导出时再 `import('js-export-excel')` 动态加载，既保功能也避免测试环境副作用。 | 已审查保留 | [.agents/memories/ERRORS.md](../../.agents/memories/ERRORS.md) |
| [.agents/memories/ERRORS.md](../../.agents/memories/ERRORS.md) L18 | 2026-05-24（订舱管理页面测试）：`src/pages/templates/book-task-list/book-task-list-page.test.tsx` 在单测里即使断言已通过，也会继续卡到超时退出（如 `should render task rows when request succeeds`）-> 该文件存在未释放的页面副作用/测试清理问题，当前功能验证优先依赖 `api.test.ts`，后续若要恢复页面级验证需单独排查定时器或异步清理链路。 | 已审查保留 | [.agents/memories/ERRORS.md](../../.agents/memories/ERRORS.md) |
| [.agents/memories/ERRORS.md](../../.agents/memories/ERRORS.md) L19 | 2026-05-25（列表视图偏好重构）：仓库级 `bun run test` 在当前环境 60 秒内未完成并被 `timeout` 终止，但共享层定向 rstest 与 `bunx tsc -p tsconfig.app.json --noEmit` 可稳定通过 -> 先用“共享层定向测试 + 类型检查”验证本次改动，不把全量测试超时直接归因到当前提交。 #promote | 已审查保留 | [.agents/memories/ERRORS.md](../../.agents/memories/ERRORS.md) |
| [.agents/memories/ERRORS.md](../../.agents/memories/ERRORS.md) L20 | 2026-05-30（接口对照）：`docs/api/api.md` 当前为空文件，按 AGENTS 流程读取时拿不到任何接口契约 -> 涉及迁移/联调需求时不能把该文件当成有效来源，应回退到已接通页面实现或旧项目源码做接口对照。 | 已修正并保留 | [docs/api/README.md](../../docs/api/README.md)、[docs/api/api.md](../../docs/api/api.md) |
| [.agents/memories/ERRORS.md](../../.agents/memories/ERRORS.md) L21 | 2026-05-30（antd表格排序测试）：给列表列加 `sorter` 后，测试里原先用 `getByLabelText/getByText` 选筛选项或弹窗字段，容易和可排序表头同名节点冲突而误报 -> 列表页测试优先改用 `placeholder/role=columnheader/findByDisplayValue`，表格顺序断言优先读 `tbody tr.ant-table-row` 的真实数据行。 #promote | 已审查保留 | [.agents/memories/ERRORS.md](../../.agents/memories/ERRORS.md) |
| [.agents/memories/ERRORS.md](../../.agents/memories/ERRORS.md) L22 | 2026-05-30（生产打包）：`bun run build:production` 会先跑 `tsc -b`，因此 `src/**/*.test.tsx` 的类型错误也会直接拦住打包；本次报错为 `remind-list-page.test.tsx` 中闭包变量 `capturedForm` 经非空判断后仍被推断异常，修复方式是收口到返回明确类型的 helper，再调用 `setFieldValue`。同时仓库需保留标准 `build` 脚本，避免 `npm run build` 直接报 `Missing script: "build"`。 | 已审查保留 | [.agents/memories/ERRORS.md](../../.agents/memories/ERRORS.md) |
| [.agents/memories/ERRORS.md](../../.agents/memories/ERRORS.md) L23 | 2026-06-06（标准列表 virtual 改造）：当前仓库跑定向 `bunx eslint` 时，会被 `src/pages/templates/book-task-list/book-task-list-page.tsx:374` 的既有 `react-hooks/set-state-in-effect` 错误拦住；跑 `bunx tsc -b --pretty false` 时，会被 `src/infrastructure/http/legacy-envelope.ts:32` 的既有泛型返回类型错误拦住 -> 本次列表虚拟滚动改造应以“定向 rstest 通过”作为主验证，静态检查需将这两处历史问题与当前改动分开判断。 | 已审查保留 | [.agents/memories/ERRORS.md](../../.agents/memories/ERRORS.md) |
| [.agents/memories/ERRORS.md](../../.agents/memories/ERRORS.md) L24 | 2026-06-06（列表列宽测量）：Codex in-app browser 的只读 `evaluate` 环境缺少 `document.createElement` / `createRange` / `canvas` 等能力，无法做精确文本测宽 -> 列宽测量应改用真实 Playwright 页面上下文，通过 `canvas.measureText(...)` 结合页面真实字体、padding 和虚拟表滚动采样完成。 #promote | 已审查保留 | [.agents/memories/ERRORS.md](../../.agents/memories/ERRORS.md) |
| [.agents/memories/ERRORS.md](../../.agents/memories/ERRORS.md) L25 | 2026-06-12（禁用列表虚拟滚动）：`bun run test src/shared/template-kit/recipes/standard-list-page-recipe.test.tsx src/pages/templates/msk-query-list/msk-query-list-page.test.tsx` 会被 Maersk 页面既有用例 `should block batch submit when no fields are changed` 5s 超时拦住；本次相关用例可用精确 `--testNamePattern` 单独验证，避免把旧异步清理问题误判为虚拟滚动回归。 | 已审查保留 | [.agents/memories/ERRORS.md](../../.agents/memories/ERRORS.md) |
| [.agents/memories/ERRORS.md](../../.agents/memories/ERRORS.md) L26 | 2026-08-11（Maersk 航线映射）：新环境先执行 `bun install --frozen-lockfile` 才有本地 `rstest`；安装后若报 `@rspack/core@2.0.0-rc.1` 与 binding `1.7.11` 不匹配，可将 `RSPACK_BINDING` 指向 `node_modules/@rstest/core/node_modules/@rsbuild/core/node_modules/@rspack/core/node_modules/@rspack/binding` 后运行定向测试。 #promote | 已审查保留 | [.agents/memories/ERRORS.md](../../.agents/memories/ERRORS.md) |
| [.agents/memories/LEARNINGS.md](../../.agents/memories/LEARNINGS.md) L9 | 2026-10-21: 本项目 Rsbuild 会解析 CSS 的 `url()`：在 `src/index.css` 引入 `public/` 中字体时使用相对路径，由构建生成哈希资源；直接写 `/fonts/...` 曾导致 css-loader 无法解析。以生产构建及实际 Rendered Fonts 验证结果为准。 | 已审查保留 | [.agents/memories/LEARNINGS.md](../../.agents/memories/LEARNINGS.md) |
| [.agents/memories/LEARNINGS.md](../../.agents/memories/LEARNINGS.md) L10 | 2026-10-21: 筛选区与 Modal 复用同名 AntD 字段时，为各 Form 设置独立 `name`，避免重复 DOM id 导致 label 指向错误控件。jsdom 验证 Modal 收起时可在测试 ConfigProvider 关闭 motion，保留可访问性和业务断言，避免等待不会自然完成的 CSS 动画。 | 已审查保留 | [.agents/memories/LEARNINGS.md](../../.agents/memories/LEARNINGS.md) |
| [.agents/memories/LEARNINGS.md](../../.agents/memories/LEARNINGS.md) L11 | 2026-10-21: 字体选型已明确时，不把“尚未下载验证”写成“资源缺失”或新的用户确认项。Maersk 官方字体入口为 `https://assets.maerskline.com/mds/fonts/fonts-cdn.css`；当日已读取 Text 400/500/600/700 与 Headline 400/700 的 WOFF2，均返回 200。资源获取、实际渲染和中文回退分别核查，不将它们混作需求未定。 | 已去重 | [docs/plans/2026-10-21-website-booking-adjustments-verification.md](../../docs/plans/2026-10-21-website-booking-adjustments-verification.md)、[public/fonts/maersk/README.md](../../public/fonts/maersk/README.md)、[docs/plans/2026-10-21-1126-feat-website-booking-adjustments-plan.md](../../docs/plans/2026-10-21-1126-feat-website-booking-adjustments-plan.md) |
| [.agents/memories/LEARNINGS.md](../../.agents/memories/LEARNINGS.md) L12 | 2026-05-07: 列表检索统一采用“筛选项变更不自动请求，仅点击查询触发（重置除外）”，可显著降低误请求与状态抖动。 #promote | 已正式承接后去重 | [docs/ai/list-migration-rules.md](../../docs/ai/list-migration-rules.md) |
| [.agents/memories/LEARNINGS.md](../../.agents/memories/LEARNINGS.md) L13 | 2026-05-07: 页面实现应先对齐稳定骨架再填业务差异；列表按“筛选区/内容区/反馈区/权限区”，表单按“编辑工作条 + 只读阻断”组织，能降低回归风险。 #promote | 已正式承接后去重 | [docs/ai/list-migration-rules.md](../../docs/ai/list-migration-rules.md)、[docs/ai/form-migration-rules.md](../../docs/ai/form-migration-rules.md) |
| [.agents/memories/LEARNINGS.md](../../.agents/memories/LEARNINGS.md) L14 | 2026-05-07: 列表与表单都要把状态反馈做全：列表固定 `loading/empty/error`，写操作固定成功/失败明确提示。 | 已去重 | [docs/ai/page-guardrail-recipes.md](../../docs/ai/page-guardrail-recipes.md)、[docs/testing-standards.md](../../docs/testing-standards.md) |
| [.agents/memories/LEARNINGS.md](../../.agents/memories/LEARNINGS.md) L15 | 2026-05-07: 只读模式必须双重阻断（UI 禁用 + 行为层硬阻断），避免绕过前端状态发起越权提交。 #promote | 已去重 | [docs/ai/development-rules.md](../../docs/ai/development-rules.md)、[docs/ai/form-migration-rules.md](../../docs/ai/form-migration-rules.md) |
| [.agents/memories/LEARNINGS.md](../../.agents/memories/LEARNINGS.md) L16 | 2026-05-07: `mode/id` 等关键参数应在页面首层做前置校验，校验失败立即显示错误反馈，不进入后续副作用链路。 | 已正式承接后去重 | [docs/ai/form-migration-rules.md](../../docs/ai/form-migration-rules.md) |
| [.agents/memories/LEARNINGS.md](../../.agents/memories/LEARNINGS.md) L17 | 2026-05-07: 复杂组件不能依赖默认行为；回填、提交、搜索参数、父子联动规则必须显式定义并测试覆盖。 | 已审查保留 | [.agents/memories/LEARNINGS.md](../../.agents/memories/LEARNINGS.md) |
| [.agents/memories/LEARNINGS.md](../../.agents/memories/LEARNINGS.md) L18 | 2026-05-07: 重置语义应定义为“全状态重置”，除表单字段外还要清理树展开、关键词、选中态等派生状态。 #promote | 已去重 | [docs/ai/development-rules.md](../../docs/ai/development-rules.md)、[docs/ai/form-migration-rules.md](../../docs/ai/form-migration-rules.md) |
| [.agents/memories/LEARNINGS.md](../../.agents/memories/LEARNINGS.md) L19 | 2026-05-07: 初始化加载与条件加载要拆分 effect，并稳定依赖引用，避免重复请求与渲染抖动。 #promote | 已审查保留 | [.agents/memories/LEARNINGS.md](../../.agents/memories/LEARNINGS.md) |
| [.agents/memories/LEARNINGS.md](../../.agents/memories/LEARNINGS.md) L20 | 2026-05-07: 枚举值域应单一来源，筛选项/表格展示/提交语义共用同一映射常量，防止多处漂移。 | 已审查保留 | [.agents/memories/LEARNINGS.md](../../.agents/memories/LEARNINGS.md) |
| [.agents/memories/LEARNINGS.md](../../.agents/memories/LEARNINGS.md) L21 | 2026-05-07: 列表工具栏与操作列采用统一规范（刷新/密度/列设置复用，操作列右侧固定、右对齐、宽度开发期固定）。 | 已审查保留 | [.agents/memories/LEARNINGS.md](../../.agents/memories/LEARNINGS.md) |
| [.agents/memories/LEARNINGS.md](../../.agents/memories/LEARNINGS.md) L22 | 2026-05-11: 列表页的列设置面板不应在页面内手写 `Checkbox.Group`；统一由 `ListToolbarActions` 渲染，页面仅传 `columnSettingOptions + selectedColumnKeys + onSelectedColumnKeysChange`。 #promote | 已去重 | [docs/ai/list-migration-rules.md](../../docs/ai/list-migration-rules.md) |
| [.agents/memories/LEARNINGS.md](../../.agents/memories/LEARNINGS.md) L23 | 2026-05-11: 列表筛选下拉若存在超过10个字的选项，统一在模板层自动将 `popupMatchSelectWidth` 设为 `300`；不超10字保持默认，若页面显式传入则以页面配置为准。 #promote | 已去重 | [docs/ai/list-migration-rules.md](../../docs/ai/list-migration-rules.md) |
| [.agents/memories/LEARNINGS.md](../../.agents/memories/LEARNINGS.md) L24 | 2026-05-07: 测试最小基线固定为 happy path + 至少一个失败/边界分支（参数错误、无权限、写操作失败）。 #promote | 已去重 | [docs/testing-standards.md](../../docs/testing-standards.md) |
| [.agents/memories/LEARNINGS.md](../../.agents/memories/LEARNINGS.md) L25 | 2026-05-09: 标准列表页中，`request/transformResponse` 等请求链路回调必须保持稳定引用；否则勾选行、打开弹窗等纯 UI 状态变化也可能触发首屏 `load` effect 重跑，表现为“勾选即刷新”。 #promote | 已修正并保留 | [src/shared/template-kit](../../src/shared/template-kit) |
| [.agents/memories/LEARNINGS.md](../../.agents/memories/LEARNINGS.md) L26 | 2026-05-13: 列表页批量操作若同时支持“选中项”和“当前筛选结果全量”，建议把“作用域判定”和“分页任务队列”拆成共享能力，页面只保留按钮文案与成功失败反馈，能显著降低两套列表逻辑漂移。 | 已修正并保留 | [src/pages/templates/book-task-list](../../src/pages/templates/book-task-list)、[src/pages/templates/msk-query-list](../../src/pages/templates/msk-query-list)、[docs/api/api.md](../../docs/api/api.md) |
| [.agents/memories/LEARNINGS.md](../../.agents/memories/LEARNINGS.md) L27 | 2026-05-19: 本仓库测试需走 `bun run test <file>` / `rstest run`，不要直接用裸 `bun test`；否则 `@rstest/core` 生命周期与 `jsdom` 窗口环境不会正确注册。 | 已合并测试入口说明 | [docs/testing-standards.md](../../docs/testing-standards.md)、[.agents/memories/ERRORS.md](../../.agents/memories/ERRORS.md) |
| [.agents/memories/LEARNINGS.md](../../.agents/memories/LEARNINGS.md) L28 | 2026-06-01: 提醒列表 `is_use` 的展示语义以当前用户口径为准，不能继续沿用旧版 public 参考；当“已作废/未作废”口径调整时，单条与批量作废的前端拦截条件也要同步调整，避免文案和行为反向漂移。 | 已审查保留 | [.agents/memories/LEARNINGS.md](../../.agents/memories/LEARNINGS.md) |
| [.agents/memories/LEARNINGS.md](../../.agents/memories/LEARNINGS.md) L29 | 2026-06-06: 大表格列表页测试头部按钮时，优先基于 `.list-card-header-*` 容器断言文本或局部节点，避免对整页使用全局 `getByRole/getByText` 导致超时（如 `book-task-list`）。 | 已审查保留 | [.agents/memories/LEARNINGS.md](../../.agents/memories/LEARNINGS.md) |
| [.agents/memories/LEARNINGS.md](../../.agents/memories/LEARNINGS.md) L30 | 2026-06-06: Antd `Table` 开启真实 `virtual` 时，`scroll.x` 和 `scroll.y` 都必须传数字；标准列表页不能继续沿用 `x: 'max-content'`，应在虚拟模式下直接复用 recipe 计算出的数值型 `virtualScroll.scroll`。 #promote | 已修正并保留 | [src/shared/template-kit/recipes/standard-list-page-recipe.tsx](../../src/shared/template-kit/recipes/standard-list-page-recipe.tsx)、[src/shared/template-kit/recipes/standard-list-page-recipe.test.tsx](../../src/shared/template-kit/recipes/standard-list-page-recipe.test.tsx) |
| [.agents/memories/LEARNINGS.md](../../.agents/memories/LEARNINGS.md) L31 | 2026-06-06: 非操作列宽度应按真实页面测量固化：先登录本地页面、进入目标列表、采集前 20 条数据（虚拟表需滚动 `.ant-table-tbody-virtual-holder` 并按 `data-row-key` 去重），再按“表头单行宽度 vs 正文 P90 宽度取大值 + 左右 padding + 16px 安全余量、上限 220px”收口；若当前页无数据必须明确告知无法测量。 #promote | 已去重 | [docs/ai/list-column-width-rules.md](../../docs/ai/list-column-width-rules.md) |
| [.agents/memories/LEARNINGS.md](../../.agents/memories/LEARNINGS.md) L32 | 2026-06-06: Antd `Table` 的可排序列若通过 `onHeaderCell: () => 常量对象` 复用同一个返回值，排序注入会把 `aria/className/onClick` 串写到其他表头；共享层启用多列排序时必须先把 `onHeaderCell` 返回值克隆成每列独立对象。 #promote | 已审查保留 | [.agents/memories/LEARNINGS.md](../../.agents/memories/LEARNINGS.md) |
| [.agents/memories/LEARNINGS.md](../../.agents/memories/LEARNINGS.md) L33 | 2026-06-06: `msk-query-list` 的“备注”字段前端口径是 `tips`，`log` 在该页承担航线/链接映射语义，不应混作备注提交字段。 | 已修正并保留 | [src/pages/templates/msk-query-list](../../src/pages/templates/msk-query-list) |
| [.agents/memories/ERRORS.md](../../.agents/memories/ERRORS.md) L3 | 分类说明与推荐格式 | 已审查保留 | [.agents/memories/ERRORS.md](../../.agents/memories/ERRORS.md) |
| [.agents/memories/LEARNINGS.md](../../.agents/memories/LEARNINGS.md) L3 | 分类说明与推荐格式 | 已审查保留 | [.agents/memories/LEARNINGS.md](../../.agents/memories/LEARNINGS.md) |
| [.agents/memories/FEATURE_REQUESTS.md](../../.agents/memories/FEATURE_REQUESTS.md) L3 | 分类说明与推荐格式；FEATURE_REQUESTS没有实际诉求 | 已审查保留 | [.agents/memories/FEATURE_REQUESTS.md](../../.agents/memories/FEATURE_REQUESTS.md) |
| [docs/ai/project-memory.md](../../docs/ai/project-memory.md) L1 | 旧独立记忆流程 | 已收口导航 | [docs/ai/development-rules.md](../../docs/ai/development-rules.md)、[.agents/memories/README.md](../../.agents/memories/README.md) |

## 变更原文追溯

下列完整原文为执行前快照，不是现行规则或待执行指令；来源日期和适用范围随正文承接或在此保留。

### 收尾-01 已去重

来源：[.agents/memories/PROFILE.md](../../.agents/memories/PROFILE.md)，收尾前L6。承接：[docs/ai/development-rules.md](../../docs/ai/development-rules.md)、[README.md](../../README.md)。

```text
- Stack: React + TypeScript + Rsbuild + Ant Design + TailwindCSS
```

### 收尾-02 已正式承接后去重

来源：[.agents/memories/PROFILE.md](../../.agents/memories/PROFILE.md)，收尾前L10。承接：[docs/ai/development-rules.md](../../docs/ai/development-rules.md)。

```text
- Prefer practical, low-latency solutions
```

### 收尾-03 已去重

来源：[.agents/memories/PROFILE.md](../../.agents/memories/PROFILE.md)，收尾前L11。承接：[docs/ai/development-rules.md](../../docs/ai/development-rules.md)。

```text
- Prefer minimal, scoped changes over broad refactors
```

### 收尾-04 已正式承接后去重

来源：[.agents/memories/PROFILE.md](../../.agents/memories/PROFILE.md)，收尾前L15。承接：[docs/ai/development-rules.md](../../docs/ai/development-rules.md)。

```text
- Keep changes scoped and directly actionable
```

### 收尾-05 已正式承接后去重

来源：[.agents/memories/PROFILE.md](../../.agents/memories/PROFILE.md)，收尾前L16。承接：[docs/ai/development-rules.md](../../docs/ai/development-rules.md)。

```text
- Preserve existing theme structure unless new variables are required
```

### 收尾-06 已去重

来源：[.agents/memories/ACTIVE.md](../../.agents/memories/ACTIVE.md)，收尾前L5。承接：[docs/ai/development-rules.md](../../docs/ai/development-rules.md)。

```text
- 接口策略：方法与路径严格以 `docs/api/api.md` 为准，不按模板臆断接口。
```

### 收尾-07 已去重

来源：[.agents/memories/LEARNINGS.md](../../.agents/memories/LEARNINGS.md)，收尾前L11。承接：[docs/plans/2026-10-21-website-booking-adjustments-verification.md](../../docs/plans/2026-10-21-website-booking-adjustments-verification.md)、[public/fonts/maersk/README.md](../../public/fonts/maersk/README.md)、[docs/plans/2026-10-21-1126-feat-website-booking-adjustments-plan.md](../../docs/plans/2026-10-21-1126-feat-website-booking-adjustments-plan.md)。

```text
- 2026-10-21: 字体选型已明确时，不把“尚未下载验证”写成“资源缺失”或新的用户确认项。Maersk 官方字体入口为 `https://assets.maerskline.com/mds/fonts/fonts-cdn.css`；当日已读取 Text 400/500/600/700 与 Headline 400/700 的 WOFF2，均返回 200。资源获取、实际渲染和中文回退分别核查，不将它们混作需求未定。
```

### 收尾-08 已去重

来源：[.agents/memories/LEARNINGS.md](../../.agents/memories/LEARNINGS.md)，收尾前L14。承接：[docs/ai/page-guardrail-recipes.md](../../docs/ai/page-guardrail-recipes.md)、[docs/testing-standards.md](../../docs/testing-standards.md)。

```text
- 2026-05-07: 列表与表单都要把状态反馈做全：列表固定 `loading/empty/error`，写操作固定成功/失败明确提示。
```

### 收尾-09 已去重

来源：[.agents/memories/LEARNINGS.md](../../.agents/memories/LEARNINGS.md)，收尾前L15。承接：[docs/ai/development-rules.md](../../docs/ai/development-rules.md)、[docs/ai/form-migration-rules.md](../../docs/ai/form-migration-rules.md)。

```text
- 2026-05-07: 只读模式必须双重阻断（UI 禁用 + 行为层硬阻断），避免绕过前端状态发起越权提交。 #promote
```

### 收尾-10 已去重

来源：[.agents/memories/LEARNINGS.md](../../.agents/memories/LEARNINGS.md)，收尾前L18。承接：[docs/ai/development-rules.md](../../docs/ai/development-rules.md)、[docs/ai/form-migration-rules.md](../../docs/ai/form-migration-rules.md)。

```text
- 2026-05-07: 重置语义应定义为“全状态重置”，除表单字段外还要清理树展开、关键词、选中态等派生状态。 #promote
```

### 收尾-11 已去重

来源：[.agents/memories/LEARNINGS.md](../../.agents/memories/LEARNINGS.md)，收尾前L22。承接：[docs/ai/list-migration-rules.md](../../docs/ai/list-migration-rules.md)。

```text
- 2026-05-11: 列表页的列设置面板不应在页面内手写 `Checkbox.Group`；统一由 `ListToolbarActions` 渲染，页面仅传 `columnSettingOptions + selectedColumnKeys + onSelectedColumnKeysChange`。 #promote
```

### 收尾-12 已去重

来源：[.agents/memories/LEARNINGS.md](../../.agents/memories/LEARNINGS.md)，收尾前L23。承接：[docs/ai/list-migration-rules.md](../../docs/ai/list-migration-rules.md)。

```text
- 2026-05-11: 列表筛选下拉若存在超过10个字的选项，统一在模板层自动将 `popupMatchSelectWidth` 设为 `300`；不超10字保持默认，若页面显式传入则以页面配置为准。 #promote
```

### 收尾-13 已去重

来源：[.agents/memories/LEARNINGS.md](../../.agents/memories/LEARNINGS.md)，收尾前L24。承接：[docs/testing-standards.md](../../docs/testing-standards.md)。

```text
- 2026-05-07: 测试最小基线固定为 happy path + 至少一个失败/边界分支（参数错误、无权限、写操作失败）。 #promote
```

### 收尾-14 已去重

来源：[.agents/memories/LEARNINGS.md](../../.agents/memories/LEARNINGS.md)，收尾前L31。承接：[docs/ai/list-column-width-rules.md](../../docs/ai/list-column-width-rules.md)。

```text
- 2026-06-06: 非操作列宽度应按真实页面测量固化：先登录本地页面、进入目标列表、采集前 20 条数据（虚拟表需滚动 `.ant-table-tbody-virtual-holder` 并按 `data-row-key` 去重），再按“表头单行宽度 vs 正文 P90 宽度取大值 + 左右 padding + 16px 安全余量、上限 220px”收口；若当前页无数据必须明确告知无法测量。 #promote
```

### 收尾-15 已正式承接后去重

来源：[.agents/memories/LEARNINGS.md](../../.agents/memories/LEARNINGS.md)，收尾前L12。承接：[docs/ai/list-migration-rules.md](../../docs/ai/list-migration-rules.md)。

```text
- 2026-05-07: 列表检索统一采用“筛选项变更不自动请求，仅点击查询触发（重置除外）”，可显著降低误请求与状态抖动。 #promote
```

### 收尾-16 已正式承接后去重

来源：[.agents/memories/LEARNINGS.md](../../.agents/memories/LEARNINGS.md)，收尾前L13。承接：[docs/ai/list-migration-rules.md](../../docs/ai/list-migration-rules.md)、[docs/ai/form-migration-rules.md](../../docs/ai/form-migration-rules.md)。

```text
- 2026-05-07: 页面实现应先对齐稳定骨架再填业务差异；列表按“筛选区/内容区/反馈区/权限区”，表单按“编辑工作条 + 只读阻断”组织，能降低回归风险。 #promote
```

### 收尾-17 已正式承接后去重

来源：[.agents/memories/LEARNINGS.md](../../.agents/memories/LEARNINGS.md)，收尾前L16。承接：[docs/ai/form-migration-rules.md](../../docs/ai/form-migration-rules.md)。

```text
- 2026-05-07: `mode/id` 等关键参数应在页面首层做前置校验，校验失败立即显示错误反馈，不进入后续副作用链路。
```

### 收尾-18 已合并测试入口说明

来源：[.agents/memories/LEARNINGS.md](../../.agents/memories/LEARNINGS.md)，收尾前L27。承接：[docs/testing-standards.md](../../docs/testing-standards.md)、[.agents/memories/ERRORS.md](../../.agents/memories/ERRORS.md)。

```text
- 2026-05-19: 本仓库测试需走 `bun run test <file>` / `rstest run`，不要直接用裸 `bun test`；否则 `@rstest/core` 生命周期与 `jsdom` 窗口环境不会正确注册。
```

### 收尾-19 已修正并保留

来源：[.agents/memories/LEARNINGS.md](../../.agents/memories/LEARNINGS.md)，收尾前L25。承接：[src/shared/template-kit](../../src/shared/template-kit)。

```text
- 2026-05-09: 标准列表页中，`request/transformResponse` 等请求链路回调必须保持稳定引用；否则勾选行、打开弹窗等纯 UI 状态变化也可能触发首屏 `load` effect 重跑，表现为“勾选即刷新”。 #promote
```

执行后的表述：

```text
- 2026-05-09: 标准列表曾因请求链路依赖抖动，在勾选行或打开弹窗时重新触发首屏加载。2026-10-22 核对：当前 use-latest-request 将 request/错误回调存 ref，controller 也通过 ref 读取 transformResponse；应保持查询参数身份与 load 稳定，选择状态变化不应重刷。保留原根因，不再将所有 request/transformResponse 引用变化断言为必然重刷，也不新增强制所有回调 useCallback 的规则。
```

### 收尾-20 已修正并保留

来源：[.agents/memories/LEARNINGS.md](../../.agents/memories/LEARNINGS.md)，收尾前L26。承接：[src/pages/templates/book-task-list](../../src/pages/templates/book-task-list)、[src/pages/templates/msk-query-list](../../src/pages/templates/msk-query-list)、[docs/api/api.md](../../docs/api/api.md)。

```text
- 2026-05-13: 列表页批量操作若同时支持“选中项”和“当前筛选结果全量”，建议把“作用域判定”和“分页任务队列”拆成共享能力，页面只保留按钮文案与成功失败反馈，能显著降低两套列表逻辑漂移。
```

执行后的表述：

```text
- 2026-05-13: 批量操作同时涉及选中项和筛选结果时，先核对该页面的业务作用域，再复用已有分页队列，避免两套逻辑漂移。2026-10-22 核对：订舱页已有 useBatchQueueTask 与全量 ID 获取；MSK 页处理选中项或当前页，不证明两者具有相同的“全量筛选”语义。保留有条件的复用建议，未证明共同行为前不新增统一作用域抽象，也不因此开始重构。
```

### 收尾-21 已修正并保留

来源：[.agents/memories/LEARNINGS.md](../../.agents/memories/LEARNINGS.md)，收尾前L30。承接：[src/shared/template-kit/recipes/standard-list-page-recipe.tsx](../../src/shared/template-kit/recipes/standard-list-page-recipe.tsx)、[src/shared/template-kit/recipes/standard-list-page-recipe.test.tsx](../../src/shared/template-kit/recipes/standard-list-page-recipe.test.tsx)。

```text
- 2026-06-06: Antd `Table` 开启真实 `virtual` 时，`scroll.x` 和 `scroll.y` 都必须传数字；标准列表页不能继续沿用 `x: 'max-content'`，应在虚拟模式下直接复用 recipe 计算出的数值型 `virtualScroll.scroll`。 #promote
```

执行后的表述：

```text
- 2026-06-06: 显式启用 Antd Table 的真实 virtual 时，scroll.x 和 scroll.y 都须为数字，不能沿用 max-content。2026-10-22 核对：当前标准 recipe 默认不提供 virtualScroll，MSK 也未启用 virtual；原“复用 virtualScroll.scroll”的描述仅属于历史实现，不是当前可用 API。本条作为未来明确启用时的条件经验保留，不据此恢复虚拟滚动。
```

### 收尾-22 已修正并保留

来源：[.agents/memories/LEARNINGS.md](../../.agents/memories/LEARNINGS.md)，收尾前L33。承接：[src/pages/templates/msk-query-list](../../src/pages/templates/msk-query-list)。

```text
- 2026-06-06: `msk-query-list` 的“备注”字段前端口径是 `tips`，`log` 在该页承担航线/链接映射语义，不应混作备注提交字段。
```

执行后的表述：

```text
- 2026-06-06: msk-query-list 的“备注”前端字段为 tips，不应误写到 log。原记录中的“log 承担航线/链接映射”保留为当时的语义背景；2026-10-22 核对，当前航线显示来自 resolveHostByDestination/host-map，log 仅原样透传，未核实服务端完整含义。不能把历史描述当作当前映射机制或据此改接口字段。
```

### 收尾-23 已修正并保留

来源：[.agents/memories/ERRORS.md](../../.agents/memories/ERRORS.md)，收尾前L12。承接：[docs/testing-standards.md](../../docs/testing-standards.md)。

```text
- 2026-05-06: 在本项目运行单测应使用 `bun run test <files>`（走 rstest/jsdom），直接 `bun test <file>` 会落到 bun 默认环境导致 `window is not defined`。
```

执行后的表述：

```text
- 2026-05-06（同主题来源：2026-05-13、2026-05-19）: 本项目单测通过 bun run test <files> 调用 rstest run/jsdom；裸 bun test 绕过项目环境及 Rstest 生命周期注册，历史上出现 window is not defined 等初始化失败。三份来源已合并，日期和原因保留，当前命令说明见 [测试标准](../../docs/testing-standards.md#2-test-layering-mandatory)；资料合并不代表新增三次独立复发。
```

### 收尾-24 已合并同主题历史记录

来源：[.agents/memories/ERRORS.md](../../.agents/memories/ERRORS.md)，收尾前L16。承接：[.agents/memories/ERRORS.md](../../.agents/memories/ERRORS.md)、[docs/testing-standards.md](../../docs/testing-standards.md)。

```text
- 2026-05-13（MSK/订舱批量操作）：在本项目跑前端单测应使用 `bun run test <file>`，直接 `bun test <file>` 会绕过 rstest 的 jsdom 环境，触发 `window is not defined` 或浏览器依赖模块初始化失败。
```

### 收尾-25 已修正并保留

来源：[.agents/memories/ERRORS.md](../../.agents/memories/ERRORS.md)，收尾前L20。承接：[docs/api/README.md](../../docs/api/README.md)、[docs/api/api.md](../../docs/api/api.md)。

```text
- 2026-05-30（接口对照）：`docs/api/api.md` 当前为空文件，按 AGENTS 流程读取时拿不到任何接口契约 -> 涉及迁移/联调需求时不能把该文件当成有效来源，应回退到已接通页面实现或旧项目源码做接口对照。
```

执行后的表述：

```text
- 2026-05-30（接口对照）: 当时 docs/api/api.md 为空，拿不到接口契约，曾结合已接通页面和旧项目源码对照。2026-10-22 核对：该文件现已记录 2026-10-21 的部分接口，不是完整后端目录；当前先读 [API 导航](../../docs/api/README.md) 与已核实范围，未覆盖部分再结合实际调用及可信后端资料核实，不直接以旧源码替代契约，也不把本轮文档核对当真实写入验收。
```

## 执行前调查与第一批阶段记录（历史快照）

> 以下为此前调查与阶段执行时的原文，“待决／拟删除／等待确认”等均是当时状态；本轮已按上方结果结项。旧的宽泛删除理由与不相关定位不能覆盖本次逐项结论。原ID、摘要和历史验收继续保留，不按旧行号继续删除。

# 记忆与经验清理待审清单

整理日期：2026-10-22。状态：**第一批 10 项已按用户确认完成；其余提案仍待确认，待决项、真实经验和验收记录保留；未提交推送。**

项目：`partime-boats`；调查分支：`main`；调查 HEAD：`c1c0f1d6f9a72e3d99226d3b182d37eb86b4fee0`。来源以本地实际文件为准，已有其他任务改动不在本轮清理授权内。

2026-10-22 路径复核：来源标签、章节标题和链接使用当前实际位置；专题经验直接位于 `docs/` 根目录，候选仍在 `.agents/memories/`。下表分别保留整理时 SHA-256 与本次路径复核 SHA-256，原调查 HEAD 和条目行号继续表示当时上下文；摘要变化不代表本轮修改了来源正文。各项拟操作、条目 ID、待决和保留状态不变，执行前仍须按内容重新核对，路径复核阶段未执行清理；后续第一批执行情况见下文。

覆盖所有现有候选、PROFILE / ACTIVE 约束、旧维护说明及本项目已有经验文档；逐项编号用于确认，不按整文件直接清空。设计节点按证据分组计数，说明文字也单列，条目数不等于独立故障数。

## 第一批执行记录

第一批已按用户确认完成，共 10 项；详见 [逐项执行记录](2026-10-22-2030-memory-cleanup-batch-1-plan.md)。记录保留删除前原文、原日期和来源摘要，并逐项标明完成状态及承接位置。

本批范围比下方原调查表更窄：`ERRORS-003`、`LEARNINGS-003` 只删除旧提升指令一行，记录说明、推荐格式和真实经验正文保留；其他条目按本批记录中的完整原文处理。本项目 11 个待决/暂存待决项全部保留，未删除整份记忆文件或任何验收文档。

下方“拟操作统计”和逐项表格保留为执行前调查快照，不代表所有条目仍待执行，也不构成后续清理授权；已完成与部分处理范围以第一批执行记录为准。

## 批次与判断口径

- 可按条目 ID 或同一操作分组确认；批准本轮管理方式、其他项目的清理或旧批次，不等于批准本表任何删除。
- “拟迁移 / 合并后删副本”包含先核对并补齐指定正式承接，再于同批删除来源；不会先删后补。若执行前发现条件不符，保留源条目并报告差异。
- 来源定位是静态证据；只出现同名符号不能证明完整覆盖。本轮不运行测试、构建、GUI、网络或真实业务请求，不把旧结果写成当前通过。
- 待决项在确认前保留；设计节点与原验收证据独立保留。普通工具笔记的删除理由是缺少项目长期复用价值，不是仅凭日期或未核实认定错误。
- 当前统一规则见 [开发规范](../../docs/ai/development-rules.md) 的“经验与记忆维护”；存量有效约束继续按相关任务核对，旧自动提升/定时整理指令不执行。

拟操作统计：待决 3 项；拟删除工具笔记 2 项；拟删除旧流程 5 项；拟删除环境快照 8 项；拟删除规则副本 5 项；拟删除资料副本 2 项；拟删除资源获取快照 1 项；拟合并后删副本 26 项；拟合并移除旧流程 1 项；拟迁移后删副本 2 项；暂存待决 8 项。

## 来源快照

| 当前位置 | 整理时 SHA-256 | 路径复核 SHA-256 |
| --- | --- | --- |
| [.agents/memories/ACTIVE.md](../../.agents/memories/ACTIVE.md) | `33cbb64f4f1792fb931dce84286c9bc021ee0bf12a78562312c26b99b70b603f` | `33cbb64f4f1792fb931dce84286c9bc021ee0bf12a78562312c26b99b70b603f` |
| [.agents/memories/ERRORS.md](../../.agents/memories/ERRORS.md) | `b116ef40023c5167767f06f86c389410662f437c6edc5747ffe80f095550b495` | `b116ef40023c5167767f06f86c389410662f437c6edc5747ffe80f095550b495` |
| [.agents/memories/FEATURE_REQUESTS.md](../../.agents/memories/FEATURE_REQUESTS.md) | `c7c118419409e2b02b4765a22589359ebe124c69add056bdd551ddc5f2062072` | `c7c118419409e2b02b4765a22589359ebe124c69add056bdd551ddc5f2062072` |
| [.agents/memories/LEARNINGS.md](../../.agents/memories/LEARNINGS.md) | `f3739171eab033ea024c4c73701b0167ac199c692c41a33c6b731d1d8a2460eb` | `f3739171eab033ea024c4c73701b0167ac199c692c41a33c6b731d1d8a2460eb` |
| [.agents/memories/PROFILE.md](../../.agents/memories/PROFILE.md) | `f599a2a2647cdda0b2a72e82dffd2abdc56803b30bce4657e4be04420b3e7ba8` | `f599a2a2647cdda0b2a72e82dffd2abdc56803b30bce4657e4be04420b3e7ba8` |
| [docs/ai/project-memory.md](../../docs/ai/project-memory.md) | `d061149d8578c2c0fc5b77003d4ab427bba80321214c33227aa2f340b2234d03` | `d061149d8578c2c0fc5b77003d4ab427bba80321214c33227aa2f340b2234d03` |

确认后执行前须重新核对来源内容；本次行号仅用于定位本表快照，不能跨版本按行号直接删除。

## .agents/memories/ACTIVE.md

| ID / 来源位置 | 内容或主题 | 拟操作 | 承接 / 来源定位与具体依据 |
| --- | --- | --- | --- |
| `ACTIVE-005` L5–5 | 严格遵守 AGENTS.md 中的 Mandatory Read Order 与计划先行规则。 | 拟删除规则副本 | [docs/ai/development-rules.md](../../docs/ai/development-rules.md)：根 AGENTS、核心规范 BaseData / 目录规则及既有列宽专题已承接；保留独立表单页和本项目测量口径，不迁入其他后台的 Drawer 默认。 静态定位：[docs/ai/README.md](../../docs/ai/README.md) L3（仅相关位置）。 |
| `ACTIVE-006` L6–6 | 最小改动边界：未经明确要求，不修改已有菜单结构和旧页面行为。 | 拟删除规则副本 | [docs/ai/development-rules.md](../../docs/ai/development-rules.md)：根 AGENTS、核心规范 BaseData / 目录规则及既有列宽专题已承接；保留独立表单页和本项目测量口径，不迁入其他后台的 Drawer 默认。 |
| `ACTIVE-007` L7–7 | 交互策略：列表页新增/编辑/查看默认跳转到表单页，不默认使用 Drawer 内联编辑。 | 拟删除规则副本 | [docs/ai/development-rules.md](../../docs/ai/development-rules.md)：根 AGENTS、核心规范 BaseData / 目录规则及既有列宽专题已承接；保留独立表单页和本项目测量口径，不迁入其他后台的 Drawer 默认。 |
| `ACTIVE-008` L8–8 | 文案策略：仅使用用户语义文案，禁止暴露后端实现细节。 | 拟合并后删副本 | [docs/ai/development-rules.md](../../docs/ai/development-rules.md)：保留用户语义文案及筛选显式查询的本地约束，与页面 recipe 核对后补齐缺口再删来源。 |
| `ACTIVE-009` L9–9 | 接口策略：方法与路径严格以 docs/api/api.md 为准，不按模板臆断接口。 | 待决 | [docs/api/README.md](../../docs/api/README.md)：两条分别要求严格依赖 api.md 和指出其为空；须以当前资料、已接通调用和业务契约核对，不能将空索引当成唯一有效接口来源。 |
| `ACTIVE-010` L10–10 | 列表检索策略：筛选项变动默认不立即触发查询，请求仅在点击“查询”后触发（重置除外）。 | 拟合并后删副本 | [docs/ai/development-rules.md](../../docs/ai/development-rules.md)：保留用户语义文案及筛选显式查询的本地约束，与页面 recipe 核对后补齐缺口再删来源。 |
| `ACTIVE-011` L11–11 | 列表非操作列宽度必须走真实页面测量：以前 20 条样本覆盖至少 90% 情况，显式计入左右 padding 与额外 16px 安全余量，操作列继续独立固定宽度。 | 拟删除规则副本 | [docs/ai/development-rules.md](../../docs/ai/development-rules.md)：根 AGENTS、核心规范 BaseData / 目录规则及既有列宽专题已承接；保留独立表单页和本项目测量口径，不迁入其他后台的 Drawer 默认。 |
| `ACTIVE-015` L15–15 | 仅保留跨任务稳定复用的规则。 | 拟删除旧流程 | [docs/ai/development-rules.md](../../docs/ai/development-rules.md)：原记录、提升或自动整理说明已由统一维护章节接管；仅拟删此说明，不连带清空正文条目。 |
| `ACTIVE-016` L16–16 | 每小时整理时允许移除过期规则。 | 拟删除旧流程 | [docs/ai/development-rules.md](../../docs/ai/development-rules.md)：原记录、提升或自动整理说明已由统一维护章节接管；仅拟删此说明，不连带清空正文条目。 |

## .agents/memories/ERRORS.md

| ID / 来源位置 | 内容或主题 | 拟操作 | 承接 / 来源定位与具体依据 |
| --- | --- | --- | --- |
| `ERRORS-003` L3–7 | 记录错误现象、根因、修复方式，使用简短中文条目。 | 拟删除旧流程 | [docs/ai/development-rules.md](../../docs/ai/development-rules.md)：原记录、提升或自动整理说明已由统一维护章节接管；仅拟删此说明，不连带清空正文条目。 |
| `ERRORS-010` L10–10 | （ai-tools）：bun run -s &lt;script&gt; 在当前 Bun 版本不可用，会报 Invalid Argument '-s'；改用 bun run &lt;script&gt; 或 bun run … | 拟删除工具笔记 | [docs/ai/development-rules.md](../../docs/ai/development-rules.md)：普通 Bun 参数或本机 Python 别名排错，不形成订舱项目专属规则。 |
| `ERRORS-011` L11–11 | （gmxgy-admin-new迁移分析）：终端无 python 命令，脚本统计会直接失败（command not found: python）-&gt; 运行环境未提供 python 别名 -&gt; 统一改用 node … | 拟删除工具笔记 | [docs/ai/development-rules.md](../../docs/ai/development-rules.md)：普通 Bun 参数或本机 Python 别名排错，不形成订舱项目专属规则。 静态定位：[rsbuild.config.ts](../../rsbuild.config.ts) L4（仅相关位置）。 |
| `ERRORS-012` L12–12 | （auth-route-guard测试）：组件在测试中报 React is not defined -&gt; 文件使用 JSX 但未导入 React，且当前测试链路仍依赖旧 JSX 运行时兼容 -&gt; 在组件文件补 i… | 拟合并后删副本 | [docs/testing-standards.md](../../docs/testing-standards.md)：提炼对应条目的运行时、动态导入、真实 DOM 测量或类型验证边界，去掉当次命令日志；不得放宽已有业务断言或运行新测试。 静态定位：[src/infrastructure/auth/auth-context.tsx](../../src/infrastructure/auth/auth-context.tsx) L1（仅相关位置）。 |
| `ERRORS-013` L13–13 | 在本项目运行单测应使用 bun run test &lt;files&gt;（走 rstest/jsdom），直接 bun test &lt;file&gt; 会落到 bun 默认环境导致 window is not def… | 拟合并后删副本 | [docs/testing-standards.md](../../docs/testing-standards.md)：同一 Rstest/jsdom 入口问题重复记录，现有测试标准按当前 package.json 补齐一句必要边界即可。 静态定位：[src/infrastructure/auth/auth-storage.ts](../../src/infrastructure/auth/auth-storage.ts) L6（仅相关位置）。 |
| `ERRORS-014` L14–14 | （基础端口列表迁移）：全量 bun run tsc -p tsconfig.app.json --noEmit 会被仓库历史问题拦住：ImportMetaEnv.PUBLIC_API_BASE 未声明、js-export-e… | 拟删除环境快照 | [docs/testing-standards.md](../../docs/testing-standards.md)：当次依赖、类型、超时或清理失败的快照；不据此长期豁免当前检查，也不把未重跑当作已经修复。 静态定位：[src/infrastructure/http/api-client.ts](../../src/infrastructure/http/api-client.ts) L73（仅相关位置）。 |
| `ERRORS-015` L15–15 | （codex-admin-quick-start）：运行 bunx eslint 可能直接报 Cannot find package 'eslint-plugin-unused-imports' -&gt; 仓库本地 ESL… | 拟删除环境快照 | [docs/testing-standards.md](../../docs/testing-standards.md)：当次依赖、类型、超时或清理失败的快照；不据此长期豁免当前检查，也不把未重跑当作已经修复。 静态定位：[package.json](../../package.json) L59（仅相关位置）。 |
| `ERRORS-016` L16–16 | （提醒列表迁移）：全量 bunx tsc -b --pretty false 仍会被仓库既有类型问题拦住，且 js-export-excel 在多个列表页都缺少声明文件 -&gt; 当前迁移验证优先使用“定向 rstest … | 拟删除环境快照 | [docs/testing-standards.md](../../docs/testing-standards.md)：当次依赖、类型、超时或清理失败的快照；不据此长期豁免当前检查，也不把未重跑当作已经修复。 静态定位：[src/infrastructure/http/api-client.ts](../../src/infrastructure/http/api-client.ts) L4（仅相关位置）。 |
| `ERRORS-017` L17–17 | （MSK/订舱批量操作）：在本项目跑前端单测应使用 bun run test &lt;file&gt;，直接 bun test &lt;file&gt; 会绕过 rstest 的 jsdom 环境，触发 window is … | 拟合并后删副本 | [docs/testing-standards.md](../../docs/testing-standards.md)：同一 Rstest/jsdom 入口问题重复记录，现有测试标准按当前 package.json 补齐一句必要边界即可。 静态定位：[src/infrastructure/auth/auth-storage.ts](../../src/infrastructure/auth/auth-storage.ts) L6（仅相关位置）。 |
| `ERRORS-018` L18–18 | （MSK列表导出）：js-export-excel 顶层静态导入会在测试环境因 document 缺失直接报错 -&gt; 改为点击导出时再 import('js-export-excel') 动态加载，既保功能也避免测试环… | 拟合并后删副本 | [docs/testing-standards.md](../../docs/testing-standards.md)：提炼对应条目的运行时、动态导入、真实 DOM 测量或类型验证边界，去掉当次命令日志；不得放宽已有业务断言或运行新测试。 静态定位：[src/infrastructure/auth/auth-context.tsx](../../src/infrastructure/auth/auth-context.tsx) L1（仅相关位置）。 |
| `ERRORS-019` L19–19 | （订舱管理页面测试）：src/pages/templates/book-task-list/book-task-list-page.test.tsx 在单测里即使断言已通过，也会继续卡到超时退出（如 should rende… | 拟删除环境快照 | [docs/testing-standards.md](../../docs/testing-standards.md)：当次依赖、类型、超时或清理失败的快照；不据此长期豁免当前检查，也不把未重跑当作已经修复。 静态定位：[docs/ai/business-map.yaml](../../docs/ai/business-map.yaml) L14（仅相关位置）。 |
| `ERRORS-020` L20–20 | （列表视图偏好重构）：仓库级 bun run test 在当前环境 60 秒内未完成并被 timeout 终止，但共享层定向 rstest 与 bunx tsc -p tsconfig.app.json --noEmit 可… | 拟删除环境快照 | [docs/testing-standards.md](../../docs/testing-standards.md)：当次依赖、类型、超时或清理失败的快照；不据此长期豁免当前检查，也不把未重跑当作已经修复。 静态定位：[src/pages/templates/book-account-list/api.test.ts](../../src/pages/templates/book-account-list/api.test.ts) L10（仅相关位置）。 |
| `ERRORS-021` L21–21 | （接口对照）：docs/api/api.md 当前为空文件，按 AGENTS 流程读取时拿不到任何接口契约 -&gt; 涉及迁移/联调需求时不能把该文件当成有效来源，应回退到已接通页面实现或旧项目源码做接口对照。 | 待决 | [docs/api/README.md](../../docs/api/README.md)：两条分别要求严格依赖 api.md 和指出其为空；须以当前资料、已接通调用和业务契约核对，不能将空索引当成唯一有效接口来源。 |
| `ERRORS-022` L22–22 | （antd表格排序测试）：给列表列加 sorter 后，测试里原先用 getByLabelText/getByText 选筛选项或弹窗字段，容易和可排序表头同名节点冲突而误报 -&gt; 列表页测试优先改用 placehol… | 拟合并后删副本 | [docs/testing-standards.md](../../docs/testing-standards.md)：提炼对应条目的运行时、动态导入、真实 DOM 测量或类型验证边界，去掉当次命令日志；不得放宽已有业务断言或运行新测试。 静态定位：[src/pages/templates/base-port-list/base-port-list-page.tsx](../../src/pages/templates/base-port-list/base-port-list-page.tsx) L120（仅相关位置）。 |
| `ERRORS-023` L23–23 | （生产打包）：bun run build:production 会先跑 tsc -b，因此 src/**/*.test.tsx 的类型错误也会直接拦住打包；本次报错为 remind-list-page.test.tsx 中闭 | 拟合并后删副本 | [docs/testing-standards.md](../../docs/testing-standards.md)：提炼对应条目的运行时、动态导入、真实 DOM 测量或类型验证边界，去掉当次命令日志；不得放宽已有业务断言或运行新测试。 静态定位：[src/pages/templates/msk-query-list/msk-query-list-page.test.tsx](../../src/pages/templates/msk-query-list/msk-query-list-page.test.tsx) L44（仅相关位置）。 |
| `ERRORS-024` L24–24 | （标准列表 virtual 改造）：当前仓库跑定向 bunx eslint 时，会被 src/pages/templates/book-task-list/book-task-list-page.tsx:374 的既有 re… | 拟删除环境快照 | [docs/testing-standards.md](../../docs/testing-standards.md)：当次依赖、类型、超时或清理失败的快照；不据此长期豁免当前检查，也不把未重跑当作已经修复。 静态定位：[docs/ai/business-map.yaml](../../docs/ai/business-map.yaml) L14（仅相关位置）。 |
| `ERRORS-025` L25–25 | （列表列宽测量）：Codex in-app browser 的只读 evaluate 环境缺少 document.createElement / createRange / canvas 等能力，无法做精确文本测宽 -&gt… | 拟合并后删副本 | [docs/testing-standards.md](../../docs/testing-standards.md)：提炼对应条目的运行时、动态导入、真实 DOM 测量或类型验证边界，去掉当次命令日志；不得放宽已有业务断言或运行新测试。 静态定位：[src/routes/routes.config.ts](../../src/routes/routes.config.ts) L18（仅相关位置）。 |
| `ERRORS-026` L26–26 | （禁用列表虚拟滚动）：bun run test src/shared/template-kit/recipes/standard-list-page-recipe.test.tsx src/pages/templates/m… | 拟删除环境快照 | [docs/testing-standards.md](../../docs/testing-standards.md)：当次依赖、类型、超时或清理失败的快照；不据此长期豁免当前检查，也不把未重跑当作已经修复。 静态定位：[docs/ai/component-catalog.yaml](../../docs/ai/component-catalog.yaml) L47（仅相关位置）。 |
| `ERRORS-027` L27–27 | （Maersk 航线映射）：新环境先执行 bun install --frozen-lockfile 才有本地 rstest；安装后若报 @rspack/core@2.0.0-rc.1 与 binding 1.7.11 不匹 | 拟删除环境快照 | [docs/testing-standards.md](../../docs/testing-standards.md)：当次依赖、类型、超时或清理失败的快照；不据此长期豁免当前检查，也不把未重跑当作已经修复。 静态定位：[package.json](../../package.json) L16（仅相关位置）。 |

## .agents/memories/FEATURE_REQUESTS.md

| ID / 来源位置 | 内容或主题 | 拟操作 | 承接 / 来源定位与具体依据 |
| --- | --- | --- | --- |
| `FEATURE_REQUESTS-003` L3–6 | 记录反复出现但当前缺失的能力，使用简短中文条目。 | 拟删除旧流程 | [docs/ai/development-rules.md](../../docs/ai/development-rules.md)：原记录、提升或自动整理说明已由统一维护章节接管；仅拟删此说明，不连带清空正文条目。 |

## .agents/memories/LEARNINGS.md

| ID / 来源位置 | 内容或主题 | 拟操作 | 承接 / 来源定位与具体依据 |
| --- | --- | --- | --- |
| `LEARNINGS-003` L3–7 | 记录可复用结论，使用简短中文条目。 | 拟删除旧流程 | [docs/ai/development-rules.md](../../docs/ai/development-rules.md)：原记录、提升或自动整理说明已由统一维护章节接管；仅拟删此说明，不连带清空正文条目。 静态定位：[docs/ai/project-memory.md](../../docs/ai/project-memory.md) L16（仅相关位置）。 |
| `LEARNINGS-010` L10–10 | 本项目 Rsbuild 会解析 CSS 的 url()：在 src/index.css 引入 public/ 中字体时使用相对路径，由构建生成哈希资源；直接写 /fonts/... 曾导致 css-loader 无法解析 | 暂存待决 | [docs/ai/development-rules.md](../../docs/ai/development-rules.md)：题述机制已列入清单，但相关符号命中不足以证明完整承接或独立长期收益。先原位保留、不新增规范，后续仅在有具体场景和证据时继续核对，不将本表当作批量搬运授权。 静态定位：[src/pages/templates/form/advanced-form-page.tsx](../../src/pages/templates/form/advanced-form-page.tsx) L40（仅相关位置）。 |
| `LEARNINGS-011` L11–11 | 筛选区与 Modal 复用同名 AntD 字段时，为各 Form 设置独立 name，避免重复 DOM id 导致 label 指向错误控件。jsdom 验证 Modal 收起时可在测试 ConfigProvider 关闭 … | 暂存待决 | [docs/api/README.md](../../docs/api/README.md)：该条可能包含业务字段或历史运行语义；目前不足以证明当前契约及正式资料缺口。先保留且不提升，待当前类型、调用或明确业务证据补齐后再提出具体迁移，不把旧样本当成当前服务事实。 |
| `LEARNINGS-012` L12–12 | 字体选型已明确时，不把“尚未下载验证”写成“资源缺失”或新的用户确认项。Maersk 官方字体入口为 https://assets.maerskline.com/mds/fonts/fonts-cdn.css；当日已读取 T… | 拟删除资源获取快照 | [DESIGN.md](../../DESIGN.md)：已确认的字体选型由设计资料及当前字体声明承接；某次 CDN 下载状态不长期记账，不重新访问外部资源。 静态定位：[public/fonts/maersk/README.md](../../public/fonts/maersk/README.md) L3（仅相关位置）。 |
| `LEARNINGS-013` L13–13 | 列表检索统一采用“筛选项变更不自动请求，仅点击查询触发（重置除外）”，可显著降低误请求与状态抖动。 #promote | 拟合并后删副本 | [docs/ai/development-rules.md](../../docs/ai/development-rules.md)：与本项目现行页面、readonly、参数、状态反馈及列宽合同逐条件合并，只去重已承接部分，保留本地例外和测试等级。 |
| `LEARNINGS-014` L14–14 | 页面实现应先对齐稳定骨架再填业务差异；列表按“筛选区/内容区/反馈区/权限区”，表单按“编辑工作条 + 只读阻断”组织，能降低回归风险。 #promote | 拟合并后删副本 | [docs/ai/development-rules.md](../../docs/ai/development-rules.md)：与本项目现行页面、readonly、参数、状态反馈及列宽合同逐条件合并，只去重已承接部分，保留本地例外和测试等级。 |
| `LEARNINGS-015` L15–15 | 列表与表单都要把状态反馈做全：列表固定 loading/empty/error，写操作固定成功/失败明确提示。 | 拟合并后删副本 | [docs/ai/development-rules.md](../../docs/ai/development-rules.md)：与本项目现行页面、readonly、参数、状态反馈及列宽合同逐条件合并，只去重已承接部分，保留本地例外和测试等级。 静态定位：[src/pages/templates/book-task-list/book-task-list-page.tsx](../../src/pages/templates/book-task-list/book-task-list-page.tsx) L875（仅相关位置）。 |
| `LEARNINGS-016` L16–16 | 只读模式必须双重阻断（UI 禁用 + 行为层硬阻断），避免绕过前端状态发起越权提交。 #promote | 拟合并后删副本 | [docs/ai/development-rules.md](../../docs/ai/development-rules.md)：与本项目现行页面、readonly、参数、状态反馈及列宽合同逐条件合并，只去重已承接部分，保留本地例外和测试等级。 |
| `LEARNINGS-017` L17–17 | mode/id 等关键参数应在页面首层做前置校验，校验失败立即显示错误反馈，不进入后续副作用链路。 | 拟合并后删副本 | [docs/ai/development-rules.md](../../docs/ai/development-rules.md)：与本项目现行页面、readonly、参数、状态反馈及列宽合同逐条件合并，只去重已承接部分，保留本地例外和测试等级。 |
| `LEARNINGS-018` L18–18 | 复杂组件不能依赖默认行为；回填、提交、搜索参数、父子联动规则必须显式定义并测试覆盖。 | 暂存待决 | [docs/testing-standards.md](../../docs/testing-standards.md)：题述机制已列入清单，但相关符号命中不足以证明完整承接或独立长期收益。先原位保留、不新增规范，后续仅在有具体场景和证据时继续核对，不将本表当作批量搬运授权。 |
| `LEARNINGS-019` L19–19 | 重置语义应定义为“全状态重置”，除表单字段外还要清理树展开、关键词、选中态等派生状态。 #promote | 暂存待决 | [docs/api/README.md](../../docs/api/README.md)：该条可能包含业务字段或历史运行语义；目前不足以证明当前契约及正式资料缺口。先保留且不提升，待当前类型、调用或明确业务证据补齐后再提出具体迁移，不把旧样本当成当前服务事实。 |
| `LEARNINGS-020` L20–20 | 初始化加载与条件加载要拆分 effect，并稳定依赖引用，避免重复请求与渲染抖动。 #promote | 暂存待决 | [docs/ai/development-rules.md](../../docs/ai/development-rules.md)：题述机制已列入清单，但相关符号命中不足以证明完整承接或独立长期收益。先原位保留、不新增规范，后续仅在有具体场景和证据时继续核对，不将本表当作批量搬运授权。 |
| `LEARNINGS-021` L21–21 | 枚举值域应单一来源，筛选项/表格展示/提交语义共用同一映射常量，防止多处漂移。 | 暂存待决 | [docs/ai/development-rules.md](../../docs/ai/development-rules.md)：题述机制已列入清单，但相关符号命中不足以证明完整承接或独立长期收益。先原位保留、不新增规范，后续仅在有具体场景和证据时继续核对，不将本表当作批量搬运授权。 |
| `LEARNINGS-022` L22–22 | 列表工具栏与操作列采用统一规范（刷新/密度/列设置复用，操作列右侧固定、右对齐、宽度开发期固定）。 | 暂存待决 | [docs/ai/development-rules.md](../../docs/ai/development-rules.md)：题述机制已列入清单，但相关符号命中不足以证明完整承接或独立长期收益。先原位保留、不新增规范，后续仅在有具体场景和证据时继续核对，不将本表当作批量搬运授权。 |
| `LEARNINGS-023` L23–23 | 列表页的列设置面板不应在页面内手写 Checkbox.Group；统一由 ListToolbarActions 渲染，页面仅传 columnSettingOptions + selectedColumnKeys + onSe… | 拟合并后删副本 | [docs/ai/development-rules.md](../../docs/ai/development-rules.md)：这些是共享列表能力的具体边界，先与当前 recipe / Toolbar 实现和回归定位核对；把仍缺失的原因及条件补入现有列表专题，不新增同义机制。 静态定位：[src/shared/components/list-toolbar-actions.test.tsx](../../src/shared/components/list-toolbar-actions.test.tsx) L66（仅相关位置）。 |
| `LEARNINGS-024` L24–24 | 列表筛选下拉若存在超过10个字的选项，统一在模板层自动将 popupMatchSelectWidth 设为 300；不超10字保持默认，若页面显式传入则以页面配置为准。 #promote | 拟合并后删副本 | [docs/ai/development-rules.md](../../docs/ai/development-rules.md)：这些是共享列表能力的具体边界，先与当前 recipe / Toolbar 实现和回归定位核对；把仍缺失的原因及条件补入现有列表专题，不新增同义机制。 静态定位：[src/shared/template-kit/list/template-list-filter-form.tsx](../../src/shared/template-kit/list/template-list-filter-form.tsx) L53（仅相关位置）。 |
| `LEARNINGS-025` L25–25 | 测试最小基线固定为 happy path + 至少一个失败/边界分支（参数错误、无权限、写操作失败）。 #promote | 拟合并后删副本 | [docs/ai/development-rules.md](../../docs/ai/development-rules.md)：与本项目现行页面、readonly、参数、状态反馈及列宽合同逐条件合并，只去重已承接部分，保留本地例外和测试等级。 |
| `LEARNINGS-026` L26–26 | 标准列表页中，request/transformResponse 等请求链路回调必须保持稳定引用；否则勾选行、打开弹窗等纯 UI 状态变化也可能触发首屏 load effect 重跑，表现为“勾选即刷新”。 #promote | 拟合并后删副本 | [docs/ai/development-rules.md](../../docs/ai/development-rules.md)：这些是共享列表能力的具体边界，先与当前 recipe / Toolbar 实现和回归定位核对；把仍缺失的原因及条件补入现有列表专题，不新增同义机制。 静态定位：[src/infrastructure/msw/handlers/template-handlers.ts](../../src/infrastructure/msw/handlers/template-handlers.ts) L5（仅相关位置）。 |
| `LEARNINGS-027` L27–27 | 列表页批量操作若同时支持“选中项”和“当前筛选结果全量”，建议把“作用域判定”和“分页任务队列”拆成共享能力，页面只保留按钮文案与成功失败反馈，能显著降低两套列表逻辑漂移。 | 待决 | [docs/ai/development-rules.md](../../docs/ai/development-rules.md)：将批量作用域与任务队列抽为共享能力属于实现建议，需当前重复事实支持；不因出现在记忆中就授权重构代码。 |
| `LEARNINGS-028` L28–28 | 本仓库测试需走 bun run test &lt;file&gt; / rstest run，不要直接用裸 bun test；否则 @rstest/core 生命周期与 jsdom 窗口环境不会正确注册。 | 拟合并后删副本 | [docs/testing-standards.md](../../docs/testing-standards.md)：同一 Rstest/jsdom 入口问题重复记录，现有测试标准按当前 package.json 补齐一句必要边界即可。 静态定位：[package.json](../../package.json) L16（仅相关位置）。 |
| `LEARNINGS-029` L29–29 | 提醒列表 is_use 的展示语义以当前用户口径为准，不能继续沿用旧版 public 参考；当“已作废/未作废”口径调整时，单条与批量作废的前端拦截条件也要同步调整，避免文案和行为反向漂移。 | 拟迁移后删副本 | [docs/api/README.md](../../docs/api/README.md)：作废状态以及 tips/log 字段归属是本业务合同；先核对当前页面和 API，再在已有业务资料承接，不泛化为通用列表规范。 静态定位：[src/pages/templates/remind-list/remind-list-page.tsx](../../src/pages/templates/remind-list/remind-list-page.tsx) L66（仅相关位置）。 |
| `LEARNINGS-030` L30–30 | 大表格列表页测试头部按钮时，优先基于 .list-card-header-* 容器断言文本或局部节点，避免对整页使用全局 getByRole/getByText 导致超时（如 book-task-list）。 | 暂存待决 | [docs/testing-standards.md](../../docs/testing-standards.md)：题述机制已列入清单，但相关符号命中不足以证明完整承接或独立长期收益。先原位保留、不新增规范，后续仅在有具体场景和证据时继续核对，不将本表当作批量搬运授权。 静态定位：[src/pages/templates/book-task-list/book-task-list-page.test.tsx](../../src/pages/templates/book-task-list/book-task-list-page.test.tsx) L202（仅相关位置）。 |
| `LEARNINGS-031` L31–31 | Antd Table 开启真实 virtual 时，scroll.x 和 scroll.y 都必须传数字；标准列表页不能继续沿用 x: 'max-content'，应在虚拟模式下直接复用 recipe 计算出的数值型 | 拟合并后删副本 | [docs/ai/development-rules.md](../../docs/ai/development-rules.md)：这些是共享列表能力的具体边界，先与当前 recipe / Toolbar 实现和回归定位核对；把仍缺失的原因及条件补入现有列表专题，不新增同义机制。 静态定位：[src/shared/template-kit/recipes/standard-list-page-recipe.test.tsx](../../src/shared/template-kit/recipes/standard-list-page-recipe.test.tsx) L361（仅相关位置）。 |
| `LEARNINGS-032` L32–32 | 非操作列宽度应按真实页面测量固化：先登录本地页面、进入目标列表、采集前 20 条数据（虚拟表需滚动 .ant-table-tbody-virtual-holder 并按 data-row-key 去重），再按“表头单行宽度 … | 拟合并后删副本 | [docs/ai/development-rules.md](../../docs/ai/development-rules.md)：与本项目现行页面、readonly、参数、状态反馈及列宽合同逐条件合并，只去重已承接部分，保留本地例外和测试等级。 静态定位：[docs/ai/list-column-width-rules.md](../../docs/ai/list-column-width-rules.md) L71（仅相关位置）。 |
| `LEARNINGS-033` L33–33 | Antd Table 的可排序列若通过 onHeaderCell: () =&gt; 常量对象 复用同一个返回值，排序注入会把 aria/className/onClick 串写到其他表头；共享层启用多列排序时必须先把 on… | 拟合并后删副本 | [docs/ai/development-rules.md](../../docs/ai/development-rules.md)：这些是共享列表能力的具体边界，先与当前 recipe / Toolbar 实现和回归定位核对；把仍缺失的原因及条件补入现有列表专题，不新增同义机制。 静态定位：[src/pages/templates/book-task-list/book-task-list-page.tsx](../../src/pages/templates/book-task-list/book-task-list-page.tsx) L472（仅相关位置）。 |
| `LEARNINGS-034` L34–34 | msk-query-list 的“备注”字段前端口径是 tips，log 在该页承担航线/链接映射语义，不应混作备注提交字段。 | 拟迁移后删副本 | [docs/api/README.md](../../docs/api/README.md)：作废状态以及 tips/log 字段归属是本业务合同；先核对当前页面和 API，再在已有业务资料承接，不泛化为通用列表规范。 |

## .agents/memories/PROFILE.md

| ID / 来源位置 | 内容或主题 | 拟操作 | 承接 / 来源定位与具体依据 |
| --- | --- | --- | --- |
| `PROFILE-005` L5–5 | Name: partime-boats | 拟删除资料副本 | [README.md](../../README.md)：项目身份和技术栈以 README 与当前工程清单为准；本条仅重复项目资料，无需作为记忆独立维护。 静态定位：[docs/ai/project-memory.md](../../docs/ai/project-memory.md) L11（仅相关位置）。 |
| `PROFILE-006` L6–6 | Stack: React + TypeScript + Rsbuild + Ant Design + TailwindCSS | 拟删除资料副本 | [README.md](../../README.md)：项目身份和技术栈以 README 与当前工程清单为准；本条仅重复项目资料，无需作为记忆独立维护。 |
| `PROFILE-010` L10–10 | Default language for memory entries: Chinese | 拟删除规则副本 | [docs/ai/development-rules.md](../../docs/ai/development-rules.md)：候选和待审清单默认中文由统一维护章节承接；不另保留记忆语言副本。 |
| `PROFILE-011` L11–11 | Prefer practical, low-latency solutions | 拟合并后删副本 | [docs/ai/development-rules.md](../../docs/ai/development-rules.md)：将该条最小改动、成本或兼容范围偏好的有效部分与现有协作原则核对，缺口只作最小补充；承接完成后删除来源。 |
| `PROFILE-012` L12–12 | Prefer minimal, scoped changes over broad refactors | 拟合并后删副本 | [docs/ai/development-rules.md](../../docs/ai/development-rules.md)：将该条最小改动、成本或兼容范围偏好的有效部分与现有协作原则核对，缺口只作最小补充；承接完成后删除来源。 |
| `PROFILE-016` L16–16 | Keep changes scoped and directly actionable | 拟合并后删副本 | [docs/ai/development-rules.md](../../docs/ai/development-rules.md)：将该条最小改动、成本或兼容范围偏好的有效部分与现有协作原则核对，缺口只作最小补充；承接完成后删除来源。 |
| `PROFILE-017` L17–17 | Preserve existing theme structure unless new variables are required | 拟合并后删副本 | [docs/ai/development-rules.md](../../docs/ai/development-rules.md)：将该条最小改动、成本或兼容范围偏好的有效部分与现有协作原则核对，缺口只作最小补充；承接完成后删除来源。 |

## docs/ai/project-memory.md

| ID / 来源位置 | 内容或主题 | 拟操作 | 承接 / 来源定位与具体依据 |
| --- | --- | --- | --- |
| `FLOW-001` L1–45 | 原独立记忆流程文件 | 拟合并移除旧流程 | [docs/ai/development-rules.md](../../docs/ai/development-rules.md)：现行流程正文已由核心规范唯一维护，当前旧文件保留原文并标注接管。确认后核对无遗漏业务约束，再删除旧文件及剩余有效引用；本轮不删除。 |

## 本轮验证与边界

本轮按 L0 检查来源覆盖、证据与目标路径、文档差异和链接。全部原记忆、经验正文及设计证据保持原字节；不修改业务代码、组件、脚本、索引、自动化配置，不提交或推送。历史验收日期、范围和未验证项保持原记录。
