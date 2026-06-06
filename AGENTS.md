# AGENTS Rules

## Execution Principles

These principles are merged as cross-task behavior guidelines.

### 1. Think Before Coding

- State key assumptions explicitly before implementation.
- If multiple valid interpretations exist, present them instead of picking silently.
- If a simpler approach exists, call it out.

### 2. Simplicity First

- Implement the minimum code needed to solve the requested problem.
- Do not add speculative features, configurability, or abstractions that were not requested.
- Avoid single-use abstractions unless there is clear near-term expansion.
- Keep error handling proportional to realistic failure modes in this project stage.

### 3. Surgical Changes

- Touch only lines directly related to the request.
- Do not refactor or restyle unrelated nearby code without explicit request.
- Match existing local style and conventions.
- Remove only unused code/imports introduced by your own changes.
- If unrelated dead code is found, mention it separately instead of deleting it by default.

### 4. Goal-Driven Execution

- Define concrete, verifiable success criteria for non-trivial tasks.
- For bug fixes, prefer: reproduce first, fix second, verify third.
- For multi-step work, briefly list steps with corresponding verification checks.

## Root Folder Creation Rule

When organizing files and modules:

1. Before creating any new top-level folder in the repository root, confirm with the user first.
2. Prefer existing folders and feature-local colocation by default.
3. If a constant/helper is used by only one file and is tightly coupled to that file's domain, keep it in the same file (or colocated domain file).
4. Extract to a standalone shared file only when it is reused by multiple modules or has clear near-term expansion.

## Parameter Defaults Rule

For function/component calls in this project:

1. If an argument value equals the callee's default value, omit that argument.
2. Pass default-valued arguments only when it improves readability in an exceptional context.
3. In code review, treat "explicitly passing defaults everywhere" as noise and prefer concise calls.

## Compound Engineering (Project Local)

Use project-local memory directory:

- `/Users/studio/Documents/GitHub/partime-boats/.agents/memories`

Before starting any task:

1. Read `/Users/studio/Documents/GitHub/partime-boats/.agents/memories/PROFILE.md`
2. Read `/Users/studio/Documents/GitHub/partime-boats/.agents/memories/ACTIVE.md`
3. Apply them as persistent project memory before analyzing user request

Log only when the result is reusable, non-obvious, or likely to recur.

Evaluate whether to log memory when any of these happen:

1. A command/tool call fails unexpectedly
2. User corrects assumptions, behavior, or terminology
3. Missing capability is requested repeatedly
4. External dependency or runtime behavior differs from expectation
5. A reusable workaround or debugging pattern is found

Write entries by category:

- `/Users/studio/Documents/GitHub/partime-boats/.agents/memories/LEARNINGS.md`: reusable learnings and corrections
- `/Users/studio/Documents/GitHub/partime-boats/.agents/memories/ERRORS.md`: debugging notes and error patterns
- `/Users/studio/Documents/GitHub/partime-boats/.agents/memories/FEATURE_REQUESTS.md`: recurring missing capabilities

Promotion rules:

1. Promote to `/Users/studio/Documents/GitHub/partime-boats/.agents/memories/ACTIVE.md` only if stable and useful across tasks
2. Keep `ACTIVE.md` concise; remove stale rules during review
3. Promote to this `AGENTS.md` only when a rule is stable at project policy level or user explicitly asks

Behavior expectations:

- Default to Chinese for memory entries unless user asks otherwise
- Do not log trivial typos or one-off noise
- Prefer concise, action-oriented entries

---

## Mandatory Read Order (before any business implementation)
1. `docs/ai/ai-rules.md`
2. `docs/ai/business-map.yaml`
3. `docs/ai/page-recipes.yaml`
4. `docs/ai/component-catalog.yaml`
5. `docs/ai/list-column-width-rules.md`
6. `docs/testing-standards.md`
7. `src/routes/routes.config.ts`
8. `src/infrastructure/auth/permissions.ts`

## Execution Protocol
- Do not write code immediately.
- First output an implementation plan.
- The plan must follow `docs/ai/ai-rules.md` exactly.

## Required Plan Output
1. Business classification (domain + recipe)
2. Page module split (filter/content/feedback/permission)
3. Form type decision (basic/step/advanced) with criteria
4. Reuse list (existing files/components/hooks)
5. File change list (add/modify)
6. Test plan (at least happy path + one failure/edge case)
7. Risk list (permission/params/state/theme)

## Hard Constraints
- Default to form readonly reuse for detail display; no standalone detail page unless special-case criteria are met.
- Avoid hardcoded styles; keep `light/dark/system` compatibility.
- 非操作列宽度必须按 `docs/ai/list-column-width-rules.md` 执行真实页面测量：以前 20 条数据为样本、覆盖至少 90% 情况、显式计入左右 padding 与额外 16px 安全余量、上限 220px；操作列继续使用独立固定宽度规则。
- Any violation of `docs/ai/ai-rules.md` means the plan is invalid and must be regenerated.

## BaseData Defaults (Learned Preferences)
- UI同构优先：列表页先对齐 `/dev/list/table` 骨架与交互，再实现业务差异。
- 最小改动边界：未经明确要求，不修改已有菜单结构和旧页面行为。
- 交互策略：列表页新增/编辑/查看默认跳转到表单页，不默认使用 Drawer 内联编辑。
- 文案策略：仅使用用户语义文案，禁止暴露后端实现细节。
- 接口策略：方法与路径严格以 `docs/api/api.md` 为准，不按模板臆断接口。
- 组件策略：业务字段组件优先由用户明确指定（如 Input/Select），再实现。
- 样式策略：编写样式时优先使用 TailwindCSS，尽量减少手写 `style`。
- 本地联调策略：前端默认同源 `/api`，开发环境通过 dev proxy 转发，避免浏览器 CORS。
- 列表检索策略：筛选项变动默认不立即触发查询，请求仅在点击“查询”后触发（重置除外）。
