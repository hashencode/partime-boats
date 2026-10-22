# Project Memory

本页承接原根 AGENTS 的完整记忆流程。下文 AGENTS.md 均指仓库根入口，记忆文件的位置与提升条件不变。

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
