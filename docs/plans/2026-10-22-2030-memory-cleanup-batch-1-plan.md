# partime-boats 第一批记忆清理执行记录

> 本文件保存第一批当时的执行范围与证据。2026-10-22 后续存量已完成收尾，见 [本轮结项记录](2026-10-22-memory-cleanup-proposals.md)；以下“保留／待决”按当时快照理解，不再构成下一批清理队列。
Created: 2026-10-22
Executed: 2026-10-22

**状态：已按用户确认完成本批 10 项；仅修改文档，待决项、真实经验和验收记录保留，未提交推送。**

调查分支：`main`；调查 HEAD：`c1c0f1d6f9a72e3d99226d3b182d37eb86b4fee0`。以下路径均相对仓库根目录。

本批已完成 10 项：10 项清理已有承接或已被替代的说明，0 项先补齐正式文档再删来源。原总表的 11 个待决/暂存待决项全部保留。

完整候选仍见 [原逐项待审清单](2026-10-22-memory-cleanup-proposals.md)。本批严格按下方保留的原文和附带补充执行；原总表同编号若建议范围更大，超出部分未执行，也未随本批获准。

## 本批保留范围

- 不删除整份记忆文件、`docs/ai/project-memory.md` 或任何验收文档；不搬迁经验文件，不设置定时复核。
- `FEATURE_REQUESTS.md` 全部保留；PROFILE 中其他偏好、项目身份和访问资料保留。
- ERRORS / LEARNINGS 的记录说明、推荐格式和 Entries 标题保留；只移除本批明确列出的旧提升指令或旧协作说明。历史正文末尾的 `#promote` 标签不批量处理。
- 错误、修复过程、验收条件和测试结果保留；本批没有按日期或尚未核实删除经验的操作。

待决 ID（全部保留）：`ACTIVE-009`、`ERRORS-021`、`LEARNINGS-010`、`LEARNINGS-011`、`LEARNINGS-018`、`LEARNINGS-019`、`LEARNINGS-020`、`LEARNINGS-021`、`LEARNINGS-022`、`LEARNINGS-027`、`LEARNINGS-030`。

本批保留接口取值、字体、测试行为、异步请求和业务状态经验；不改变独立表单页与本项目列宽口径。

## 来源快照（执行前，保留用于追溯）

| 来源文件 | SHA-256 |
| --- | --- |
| [.agents/memories/ACTIVE.md](../../.agents/memories/ACTIVE.md) | `33cbb64f4f1792fb931dce84286c9bc021ee0bf12a78562312c26b99b70b603f` |
| [.agents/memories/ERRORS.md](../../.agents/memories/ERRORS.md) | `b116ef40023c5167767f06f86c389410662f437c6edc5747ffe80f095550b495` |
| [.agents/memories/LEARNINGS.md](../../.agents/memories/LEARNINGS.md) | `f3739171eab033ea024c4c73701b0167ac199c692c41a33c6b731d1d8a2460eb` |
| [.agents/memories/PROFILE.md](../../.agents/memories/PROFILE.md) | `f599a2a2647cdda0b2a72e82dffd2abdc56803b30bce4657e4be04420b3e7ba8` |

以下行号和摘要对应执行前快照。执行时已核对完整原文、来源摘要和正式承接内容；清理后的摘要见文末，不能按执行前行号继续删除。

## 逐项执行记录

### BOATS-B1-01 必读顺序与业务实现先计划的重复提醒

- 执行状态：已完成；已按批准范围删除来源中的对应原文，未扩大清理范围。

- 原总表编号：`ACTIVE-005`。
- 来源：[.agents/memories/ACTIVE.md](../../.agents/memories/ACTIVE.md)，L5。
- 批准操作：已承接后删副本。
- 承接位置与证据：
  - [AGENTS.md](../../AGENTS.md#mandatory-read-order-before-any-business-implementation)：## Mandatory Read Order (before any business implementation)
  - [docs/ai/development-rules.md](../ai/development-rules.md#execution-protocol)：实现前必须先输出符合本文件的计划
- 批准依据（执行前核对）：原必读顺序仍在根入口，业务实施先计划仍在核心规范；不把这些业务实现步骤扩大为纯文档全量读取或全量测试。

已删除原文（保留执行前快照）：

```text
- 严格遵守 `AGENTS.md` 中的 Mandatory Read Order 与计划先行规则。
```

### BOATS-B1-02 保留现有菜单与页面行为

- 执行状态：已完成；已按批准范围删除来源中的对应原文，未扩大清理范围。

- 原总表编号：`ACTIVE-006`。
- 来源：[.agents/memories/ACTIVE.md](../../.agents/memories/ACTIVE.md)，L6。
- 批准操作：已承接后删副本。
- 承接位置与证据：
  - [docs/ai/development-rules.md](../ai/development-rules.md#basedata-defaults-learned-preferences)：最小改动边界：未经明确要求，不修改已有菜单结构和旧页面行为。
- 批准依据（执行前核对）：BaseData Defaults 已逐字承接这条本项目约束，确认后只删记忆副本，不改为其他后台的交互或检索默认。

已删除原文（保留执行前快照）：

```text
- 最小改动边界：未经明确要求，不修改已有菜单结构和旧页面行为。
```

### BOATS-B1-03 列表操作进入独立表单页

- 执行状态：已完成；已按批准范围删除来源中的对应原文，未扩大清理范围。

- 原总表编号：`ACTIVE-007`。
- 来源：[.agents/memories/ACTIVE.md](../../.agents/memories/ACTIVE.md)，L7。
- 批准操作：已承接后删副本。
- 承接位置与证据：
  - [docs/ai/development-rules.md](../ai/development-rules.md#basedata-defaults-learned-preferences)：交互策略：列表页新增/编辑/查看默认跳转到表单页，不默认使用 Drawer 内联编辑。
- 批准依据（执行前核对）：BaseData Defaults 已逐字承接这条本项目约束，确认后只删记忆副本，不改为其他后台的交互或检索默认。

已删除原文（保留执行前快照）：

```text
- 交互策略：列表页新增/编辑/查看默认跳转到表单页，不默认使用 Drawer 内联编辑。
```

### BOATS-B1-04 用户语义文案与实现细节边界

- 执行状态：已完成；已按批准范围删除来源中的对应原文，未扩大清理范围。

- 原总表编号：`ACTIVE-008`。
- 来源：[.agents/memories/ACTIVE.md](../../.agents/memories/ACTIVE.md)，L8。
- 批准操作：已承接后删副本。
- 承接位置与证据：
  - [docs/ai/development-rules.md](../ai/development-rules.md#basedata-defaults-learned-preferences)：文案策略：仅使用用户语义文案，禁止暴露后端实现细节。
- 批准依据（执行前核对）：BaseData Defaults 已逐字承接这条本项目约束，确认后只删记忆副本，不改为其他后台的交互或检索默认。

已删除原文（保留执行前快照）：

```text
- 文案策略：仅使用用户语义文案，禁止暴露后端实现细节。
```

### BOATS-B1-05 查询由显式动作触发

- 执行状态：已完成；已按批准范围删除来源中的对应原文，未扩大清理范围。

- 原总表编号：`ACTIVE-010`。
- 来源：[.agents/memories/ACTIVE.md](../../.agents/memories/ACTIVE.md)，L10。
- 批准操作：已承接后删副本。
- 承接位置与证据：
  - [docs/ai/development-rules.md](../ai/development-rules.md#basedata-defaults-learned-preferences)：列表检索策略：筛选项变动默认不立即触发查询，请求仅在点击“查询”后触发（重置除外）。
- 批准依据（执行前核对）：BaseData Defaults 已逐字承接这条本项目约束，确认后只删记忆副本，不改为其他后台的交互或检索默认。

已删除原文（保留执行前快照）：

```text
- 列表检索策略：筛选项变动默认不立即触发查询，请求仅在点击“查询”后触发（重置除外）。
```

### BOATS-B1-06 非操作列真实测量与操作列独立计算

- 执行状态：已完成；已按批准范围删除来源中的对应原文，未扩大清理范围。

- 原总表编号：`ACTIVE-011`。
- 来源：[.agents/memories/ACTIVE.md](../../.agents/memories/ACTIVE.md)，L11。
- 批准操作：已承接后删副本。
- 承接位置与证据：
  - [docs/ai/list-column-width-rules.md](../ai/list-column-width-rules.md#1-适用范围)：操作列（如 `操作`、`下单`）不使用本规则
  - [docs/ai/list-column-width-rules.md](../ai/list-column-width-rules.md#2-目标)：前 20 条数据中至少 90%
  - [docs/ai/development-rules.md](../ai/development-rules.md#3-engineering-constraints)：非操作列宽度校准必须遵循
- 批准依据（执行前核对）：列宽专题及核心规则已承接真实样本、20 条/P90、padding、16px 余量和操作列独立口径；本批只删规则副本，不执行浏览器测量，也不改原有 220px 上限。

已删除原文（保留执行前快照）：

```text
- 列表非操作列宽度必须走真实页面测量：以前 20 条样本覆盖至少 90% 情况，显式计入左右 padding 与额外 16px 安全余量，操作列继续独立固定宽度。
```

### BOATS-B1-07 旧 Promotion Notes 小节

- 执行状态：已完成；已按批准范围删除来源中的对应原文，未扩大清理范围。

- 原总表编号：`ACTIVE-015`、`ACTIVE-016`。
- 来源：[.agents/memories/ACTIVE.md](../../.agents/memories/ACTIVE.md)，L13–16。
- 批准操作：删除已替代流程。
- 承接位置与证据：
  - [docs/ai/development-rules.md](../ai/development-rules.md#经验与记忆维护)：不设置定时复核
  - [docs/ai/development-rules.md](../ai/development-rules.md#存量过渡与正式资料)：原自动记录、`#promote` 自动提升、每小时整理和自动删除指令不再执行。
- 批准依据（执行前核对）：现行规则要求按需复核和具体批次确认；该小节的提升与例行清理口径已被接管。仅拟删下方完整小节，High Priority Rules 中本批未列出的规则保留。

已删除原文（保留执行前快照）：

```text
## Promotion Notes

- 仅保留跨任务稳定复用的规则。
- 每小时整理时允许移除过期规则。
```

### BOATS-B1-08 排错说明中的旧提升标签指令

- 执行状态：已完成；已按批准范围删除来源中的对应原文，未扩大清理范围。

- 原总表编号：`ERRORS-003`。
- 来源：[.agents/memories/ERRORS.md](../../.agents/memories/ERRORS.md)，L7。
- 批准操作：删除已替代流程。
- 承接位置与证据：
  - [docs/ai/development-rules.md](../ai/development-rules.md#存量过渡与正式资料)：原自动记录、`#promote` 自动提升、每小时整理和自动删除指令不再执行。
- 批准依据（执行前核对）：旧总表曾按 Instructions 整节提出建议，本批缩小为只删这一行。中文记录说明、推荐格式、Entries 及实际条目全部保留；不批量移除历史正文末尾的标签。

已删除原文（保留执行前快照）：

```text
- 可跨任务复用的排错策略可加 `#promote`。
```

### BOATS-B1-09 经验说明中的旧提升标签指令

- 执行状态：已完成；已按批准范围删除来源中的对应原文，未扩大清理范围。

- 原总表编号：`LEARNINGS-003`。
- 来源：[.agents/memories/LEARNINGS.md](../../.agents/memories/LEARNINGS.md)，L7。
- 批准操作：删除已替代流程。
- 承接位置与证据：
  - [docs/ai/development-rules.md](../ai/development-rules.md#存量过渡与正式资料)：原自动记录、`#promote` 自动提升、每小时整理和自动删除指令不再执行。
- 批准依据（执行前核对）：旧总表曾按 Instructions 整节提出建议，本批缩小为只删这一行。中文记录说明、推荐格式、Entries 及实际条目全部保留；不批量移除历史正文末尾的标签。

已删除原文（保留执行前快照）：

```text
- 如需候选提升到 `ACTIVE.md`，在行尾加 `#promote`。
```

### BOATS-B1-10 重复的候选记忆语言约定

- 执行状态：已完成；已按批准范围删除来源中的对应原文，未扩大清理范围。

- 原总表编号：`PROFILE-010`。
- 来源：[.agents/memories/PROFILE.md](../../.agents/memories/PROFILE.md)，L10。
- 批准操作：已承接后删副本。
- 承接位置与证据：
  - [docs/ai/development-rules.md](../ai/development-rules.md#经验与记忆维护)：候选和复核清单默认使用中文
- 批准依据（执行前核对）：现行规范已明确中文约定，无需在 PROFILE 再维护一份；其他用户偏好、项目身份及访问资料均保留。

已删除原文（保留执行前快照）：

```text
- Default language for memory entries: Chinese
```

## 执行结果与核对

- 用户已确认本批 10 项；各项执行状态见上文，未授权原总表其余清理操作。
- 原总表的 11 个待决/暂存待决项逐项核对后保留；其他来源正文严格保持为“执行前内容减去本批批准原文”。
- `FEATURE_REQUESTS.md`、`docs/ai/project-memory.md`、真实经验与验收记录保持原样；未删除整份文件，未批量清理历史 `#promote` 标签。
- 删除旧小节后清理 `ACTIVE.md` 文件末尾留下的多余空行；除批准原文和这项格式整理外，其余来源正文不变。
- 仅做文档内容、范围与引用核对，不运行构建、业务测试、浏览器或真实业务请求；不将历史验收当作当前业务验证。
- 保持原分支和 HEAD，不暂存、不提交、不推送，也不设置定时复核。

### 清理后的来源摘要

| 来源文件 | 执行后 SHA-256 |
| --- | --- |
| [.agents/memories/ACTIVE.md](../../.agents/memories/ACTIVE.md) | `2546642496e51c9d6e44bce6845b75a01e941f7c0344b08ba2f7455745fb03b8` |
| [.agents/memories/ERRORS.md](../../.agents/memories/ERRORS.md) | `b07b11c09b570aef83d883b92a7a6a4f1a4542ec33b2a40e91508602514435c0` |
| [.agents/memories/LEARNINGS.md](../../.agents/memories/LEARNINGS.md) | `8abff8433a86583c26188d7387c861cd4473a934af10fe4eb53604ca90411398` |
| [.agents/memories/PROFILE.md](../../.agents/memories/PROFILE.md) | `d6ad2cf105815d5be9112c25911f2a7bd70d3f94c175e72dda500451745813d4` |
