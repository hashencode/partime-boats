# ERRORS

## Instructions

- 记录错误现象、根因、修复方式，使用简短中文条目。
- 推荐格式：`- YYYY-MM-DD: [错误] 现象 -> 根因 -> 修复`
- 可跨任务复用的排错策略可加 `#promote`。

## Entries
- 2026-04-28（ai-tools）：`bun run -s <script>` 在当前 Bun 版本不可用，会报 `Invalid Argument '-s'`；改用 `bun run <script>` 或 `bun run --silent <script>`。
- 2026-04-30（gmxgy-admin-new迁移分析）：终端无 `python` 命令，脚本统计会直接失败（`command not found: python`）-> 运行环境未提供 python 别名 -> 统一改用 `node - <<'NODE'` 执行临时分析脚本。
- 2026-04-30（auth-route-guard测试）：组件在测试中报 `React is not defined` -> 文件使用 JSX 但未导入 React，且当前测试链路仍依赖旧 JSX 运行时兼容 -> 在组件文件补 `import React from 'react'`（并 `void React`）后恢复。
- 2026-05-06: 在本项目运行单测应使用 `bun run test <files>`（走 rstest/jsdom），直接 `bun test <file>` 会落到 bun 默认环境导致 `window is not defined`。
- 2026-05-09（基础端口列表迁移）：全量 `bun run tsc -p tsconfig.app.json --noEmit` 会被仓库历史问题拦住：`ImportMetaEnv.PUBLIC_API_BASE` 未声明、`js-export-excel` 缺少类型、部分旧测试 Promise 类型不匹配 -> 本次页面验证改为“新增文件定向 ESLint + 定向 rstest”，避免把历史噪音误判为本次回归。
- 2026-05-09（codex-admin-quick-start）：运行 `bunx eslint` 可能直接报 `Cannot find package 'eslint-plugin-unused-imports'` -> 仓库本地 ESLint 依赖未装全 -> 先用定向 rstest 验证代码逻辑，静态检查需补齐依赖后再跑。
- 2026-05-10（提醒列表迁移）：全量 `bunx tsc -b --pretty false` 仍会被仓库既有类型问题拦住，且 `js-export-excel` 在多个列表页都缺少声明文件 -> 当前迁移验证优先使用“定向 rstest + 定向 eslint”，不要把全量类型红灯误判为本次改动回归。
- 2026-05-13（MSK/订舱批量操作）：在本项目跑前端单测应使用 `bun run test <file>`，直接 `bun test <file>` 会绕过 rstest 的 jsdom 环境，触发 `window is not defined` 或浏览器依赖模块初始化失败。
- 2026-05-13（MSK列表导出）：`js-export-excel` 顶层静态导入会在测试环境因 `document` 缺失直接报错 -> 改为点击导出时再 `import('js-export-excel')` 动态加载，既保功能也避免测试环境副作用。
- 2026-05-24（订舱管理页面测试）：`src/pages/templates/book-task-list/book-task-list-page.test.tsx` 在单测里即使断言已通过，也会继续卡到超时退出（如 `should render task rows when request succeeds`）-> 该文件存在未释放的页面副作用/测试清理问题，当前功能验证优先依赖 `api.test.ts`，后续若要恢复页面级验证需单独排查定时器或异步清理链路。
- 2026-05-25（列表视图偏好重构）：仓库级 `bun run test` 在当前环境 60 秒内未完成并被 `timeout` 终止，但共享层定向 rstest 与 `bunx tsc -p tsconfig.app.json --noEmit` 可稳定通过 -> 先用“共享层定向测试 + 类型检查”验证本次改动，不把全量测试超时直接归因到当前提交。 #promote
