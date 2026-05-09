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
