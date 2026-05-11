# 后台页面防错骨架接入规范（第一期）

## 1. 文档定位

### 1.1 目标
这份文档用于约束当前项目的标准后台页如何优先复用 `recipe + spec + contract`。

第一期先收敛三类页面：
- 标准查询列表页
- 基础三态表单页（`add / modify / readonly`）
- 分步表单页

### 1.2 适用范围
- 页面类型：标准查询列表页、基础三态表单页、分步表单页
- 技术基线：`src/shared/template-kit/*`
- 当前 recipe：
  - `StandardListPageRecipe`
  - `BasicCrudFormRecipe`
  - `StepFormRecipe`

### 1.3 非适用范围
以下场景默认判定为 `business override`，暂不强行进入第一期标准骨架：
- 重交互工作台或复杂聚合页
- 依赖复杂字段能力块的页面（如权限树、复杂弹窗选择器、强动态字段）
- 请求源显著超出标准列表/表单生命周期的页面
- 布局层级明显突破标准骨架的页面
- 仅出现一次的高级动态表单页（例如动态成员表、跨卡片错误汇总、复合工具条）

## 2. 第一阶段架构

```text
业务页
  -> spec
  -> recipe
  -> template-kit 底座
  -> route / permission / api contracts
```

分层职责：
- `spec`：声明当前页面的结构化接入对象
- `recipe`：固化标准页布局、状态、权限和请求生命周期
- `template-kit` 底座：承载 controller、state gate、navigation 等基础能力
- `business override`：显式承接第一期 recipe 之外的特例逻辑

## 3. 可用 recipe

### 3.1 `StandardListPageRecipe`
适用于：
- 标准查询列表页
- 筛选区 + 内容区 + 状态反馈 + 权限动作结构稳定的页面

必须固化的模块：
- `filter`：统一筛选区；筛选变化不自动请求，只在点击“查询”后触发
- `content`：统一标题、卡片、工具栏、表格、分页；工具栏中的列设置面板由底座统一渲染，业务页只传结构化列配置
- `feedback`：统一 `loading / empty / error / partial`
- `permission`：页面级 permission 与按钮级动作分层

### 3.2 `BasicCrudFormRecipe`
适用于：
- `add / modify / readonly` 共用一套表单结构
- 详情默认复用 `readonly` 表单展示

必须固化的模块：
- `content`：统一页头、主卡片、字段区、固定底部操作条
- `feedback`：统一参数错误态、详情错误态、提交成功/失败反馈、只读阻断
- `permission`：`read / write` 与 `add / modify / readonly` 模式映射

### 3.3 `StepFormRecipe`
适用于：
- 自然分为 2-5 个阶段的分步表单页
- 后续步骤依赖前一步数据确认

必须固化的模块：
- `content`：统一页头、步骤条、表单容器、阶段操作区
- `feedback`：统一步骤切换与完成态承载区
- `flow`：仅收敛步骤骨架，不隐式接管业务状态机

### 3.4 高级表单页（当前不进入第一期 recipe）
适用于：
- 动态字段块较多
- 页面同时包含多卡片业务区、跨区错误汇总、动态表格编辑或复杂联动

当前结论：
- 第一阶段不提供 `AdvancedFormRecipe`
- 统一按 `business override` 处理

原因：
- 当前仓库只有一个高级表单样本，未达到“至少出现 3 次”的晋升条件
- 差异主要来自业务状态与动态字段能力，而不是单纯页面壳子
- 过早抽象容易把复杂度转移到一层看似通用、实际不稳定的 recipe 上

## 4. spec 接入规则

### 4.1 只允许结构化 spec，不允许散装 props
标准页接入必须通过：
- `StandardListPageSpec`
- `BasicCrudFormSpec`

禁止做法：
- 直接在业务页重复拼装 `controller + state + toolbar + table + action bar`
- 为了临时接入，在 recipe 上继续堆大量无边界 props

### 4.2 有限 slot，禁止通用逃生口
第一期仅允许语义明确的 slot，例如：
- `toolbarExtra`
- `renderAfterContent`
- `renderAfterForm`

禁止做法：
- `renderAnything`
- `beforeRender`
- `afterRenderEverything`
- 大范围 `customNode` 注入

如果页面差异已经超出有限 slot，可直接判定为 `business override`。

## 5. 第一阶段 contract

### 5.1 状态反馈 contract
标准页必须统一承接这些状态：
- 列表页：`loading / empty / error / partial`
- 表单页：参数错误、详情加载错误、提交成功/失败、只读阻断

要求：
- 状态文案必须页面语义化
- 状态必须带恢复动作，不能只显示提示

### 5.2 权限 contract
统一分层：
- 页面级权限：`PermissionKey`
- 按钮级权限：业务动作自行声明
- 表单模式权限：`readonly -> read`，`add/modify -> write`

禁止做法：
- 在页面里叠加拍脑袋 role 判断覆盖旧逻辑
- 同一按钮同时依赖多套无文档约束的权限口径

### 5.3 `resetAll contract`
重置必须是整页状态重置，而不是只做 `form.resetFields()`。

至少要覆盖：
- 表单字段
- 分页状态
- 临时筛选状态
- 已接入 recipe 的状态块
- 页面额外挂载的复杂组件状态

### 5.4 请求生命周期 contract
第一期 recipe 只允许显式请求源：
- initial load
- query submit
- resetAll reload
- detail fetch
- save submit
- explicit refresh

禁止 recipe 隐式新增请求源。

## 6. 晋升规则
只有满足以下条件，能力才允许从业务特例晋升到 recipe 或后续 field block：
- 至少出现 3 次
- 错误模式稳定重复
- 跨业务域可复用

不满足时，保持业务特例实现，不要为了“看起来通用”提前上升抽象。

当前明确保留为 `business override` 的样本：
- `src/pages/templates/form/advanced-form-page.tsx`

## 7. 接入清单

### 7.1 标准列表页
- [ ] 已确认页面属于标准查询列表页，而不是特例工作台/复杂聚合页
- [ ] 业务页通过 `StandardListPageSpec` 接入
- [ ] 查询只在点击“查询”后触发
- [ ] `empty / error / partial` 都有统一出口
- [ ] 新增/编辑/查看跳转保持同前缀路由
- [ ] 重置走统一 `resetAll`

### 7.2 基础表单页
- [ ] 已确认页面属于 `basic` 表单，而不是 `step / advanced`
- [ ] 业务页通过 `BasicCrudFormSpec` 接入
- [ ] `mode/id` 参数错误有首层可见错误态
- [ ] `readonly` 模式禁用提交且行为硬阻断
- [ ] 底部固定操作条只在可编辑模式展示
- [ ] 提交成功/失败反馈统一
- [ ] 重置走统一 `resetAll`

### 7.3 分步表单页
- [ ] 已确认页面属于 `step` 表单，而不是 `basic / advanced`
- [ ] 业务页通过 `StepFormSpec` 接入
- [ ] 步骤数量控制在 2-5 个自然阶段
- [ ] 步骤切换前校验与确认逻辑保持页面语义
- [ ] 完成态与返回动作保持可见

### 7.4 高级表单页（business override）
- [ ] 已确认页面不适合 `basic / step`，且确实命中动态字段或复杂联动条件
- [ ] 动态表单中的“上移/下移/删除/编号”复用 `SortActionGroup`
- [ ] 重置行为覆盖字段与复杂局部状态
- [ ] 跨区错误汇总与字段校验信息保持一致
- [ ] 未为单页特例新增无边界通用 recipe

## 8. 红线
1. 不要把重特例页硬塞进第一期标准 recipe。
2. 不要为临时页面差异新增无边界通用逃生口。
3. 不要让业务页继续重复实现状态区、固定操作条、基础导航规则。
4. 不要在 recipe 中隐式新增请求。
5. 不要把一次性 workaround 直接升级为长期平台规则。
