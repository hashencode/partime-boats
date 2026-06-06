# 列表操作区规范草案

## 1. 目标

统一列表页中的以下能力，减少页面内散装实现：

- 行操作按钮排布
- 危险操作交互
- 超宽时收敛到“更多”菜单
- 新增按钮文案命名
- 列表标题显示规则

本草案先定义 **规则** 和 **最小 API 方向**，暂不要求一次性覆盖所有页面。

## 2. 适用范围

适用于后台列表页中的：

- 列表主操作区（如“新增规则”“新增端口”）
- 表格行操作区（如“查看 / 修改 / 删除”）

不适用于：

- 批量操作吸底栏
- 表单页底部操作条
- 工作台类复杂卡片操作区

## 3. 强制规则

### 3.1 列表标题规则

- 若页面主标题与列表 `Card title` 语义重复，则不显示列表 `Card title`
- 若需求未明确说明列表区需要独立标题，则默认不显示列表 `Card title`
- 只有在列表区需要表达额外语义时才显示，例如：
  - 待处理记录
  - 历史版本
  - 关联航线

推荐：

- 页面标题：`基础端口列表`
- 列表标题：省略

不推荐：

- 页面标题：`基础端口列表`
- 列表标题：`基础端口列表`

### 3.2 新增按钮文案规则

- 列表主操作按钮不得只写“新增”
- 文案必须显式包含业务对象，让用户一眼能看懂新增的是什么

推荐：

- `新增端口`
- `新增规则`
- `新增账号`
- `新增任务`

不推荐：

- `新增`
- `新建`

### 3.3 行操作按钮排布规则

- 多个文本按钮并排时，默认使用 `Divider type="vertical"` 分隔
- 默认顺序建议：
  - 查看
  - 修改
  - 危险操作（如删除、作废）
- 危险操作按钮保留 `danger` 语义

推荐：

```tsx
<Button type="link">查看</Button>
<Divider type="vertical" />
<Button type="link">修改</Button>
<Divider type="vertical" />
<Button type="link" danger>删除</Button>
```

### 3.4 危险操作交互规则

- 是否需要确认，由具体业务后果、批量范围与用户心智决定，不再强制统一使用 `Popconfirm`
- 若保留确认交互，确认文案必须描述业务后果，不能只写泛化提示

推荐：

- `确认删除这条端口记录吗？`
- `删除后将从当前列表中移除。`

不推荐：

- `确认吗？`
- `是否继续？`

### 3.5 超宽折叠规则

- 行操作区超过当前列宽预算时，不允许依赖运行时测量动态撑开列宽
- 应在开发阶段按“可同时出现按钮集合”计算固定宽度
- 超出宽度预算的尾部操作应折叠到“更多”菜单

原因：

- 与项目现有“操作列固定宽度”规则一致
- 避免运行时抖动和布局跳变

## 4. 最小抽象方向

不建议继续在页面里直接手写：

- `Space`
- `Divider`
- `Button`
- `Popconfirm`
- `Dropdown`

更合适的方式是做成：

1. `ActionSpec`
2. `ListRowActions`

### 4.1 `ActionSpec` 建议字段

```ts
type RowActionSpec = {
  key: string
  label: string
  kind?: 'view' | 'edit' | 'delete' | 'custom'
  danger?: boolean
  disabled?: boolean
  visible?: boolean
  confirm?: {
    title: string
    description?: string
    okText?: string
    cancelText?: string
  }
  onClick: () => void | Promise<void>
}
```

设计原则：

- 页面只声明“有哪些动作”
- 渲染器统一决定按钮、分隔符、确认弹层、菜单折叠

### 4.2 `ListRowActions` 最小 API 建议

```ts
type ListRowActionsProps = {
  actions: RowActionSpec[]
  maxVisibleActions?: number
}
```

第一版建议只支持：

- 文本按钮渲染
- 自动插入 `Divider`
- 可选的危险操作确认封装
- 超出 `maxVisibleActions` 后折叠到“更多”

先不要急着支持：

- 任意自定义节点插槽
- 多级菜单
- 动态测量宽度
- 每个动作自定义完全不同的渲染方式

## 5. 推荐的第一版渲染行为

### 5.1 常规模式

当动作数未超过阈值时：

- 全部直接渲染成文本按钮
- 按顺序自动插入 `Divider`

### 5.2 折叠模式

当动作数超过阈值时：

- 保留前 1-2 个高频动作直接显示
- 其余动作进入“更多”菜单

推荐保留优先级：

1. 查看
2. 修改
3. 其他动作折叠

### 5.3 危险动作

- 直接显示还是追加确认层，由业务页面自行决定
- 收进菜单时，如需确认，可在点击菜单项后再补充确认层

## 6. 页面接入建议

### 6.1 主操作区

主操作区不一定和行操作区共用完全同一个组件，但应共用同一套命名与危险动作语义规则。

建议后续补一个：

- `ListPrimaryActions`

职责：

- 渲染“新增端口”“导出端口”等列表主操作
- 统一校验主按钮文案是否包含业务对象

### 6.2 行操作区

优先推广到这些已有样本页：

- `src/pages/templates/base-port-list/base-port-list-page.tsx`
- `src/pages/templates/list/table-query-page.tsx`
- `src/pages/templates/msk-api-list/msk-api-list-page.tsx`
- `src/pages/templates/msk-query-list/msk-query-list-page.tsx`

原因：

- 已覆盖“查看 / 修改 / 删除 / 危险确认 / Divider”几种典型模式
- 样本足够稳定，适合抽第一版

## 7. 建议的落地顺序

1. 先把规则固化到文档
2. 选 2-3 个列表页提炼最小版 `ListRowActions`
3. 等样本稳定后，再考虑 `ListPrimaryActions`
4. 最后再评估是否把动作宽度计算也一并收进共享层

## 8. 不建议的方向

- 不要做成无限制 `renderAnything` 插槽
- 不要用运行时测量结果来决定列宽
- 不要让页面继续手动插 `Divider + Popconfirm + Dropdown` 作为常态
- 不要先为了“通用”把 API 设计成大而全

## 9. 当前结论

本项目的列表操作区适合抽象，但应遵守：

- 先收规则，再收组件
- 先做最小声明式 `ActionSpec`
- 先覆盖高频列表页，再继续扩展

这样可以把“按钮间分隔、危险确认、更多折叠、文案规范”统一起来，同时避免过早抽成难维护的大杂烩。
