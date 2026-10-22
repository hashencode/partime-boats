# LEARNINGS

## Instructions

- 记录可复用结论，使用简短中文条目。
- 推荐格式：`- YYYY-MM-DD: 结论（场景）`

## Entries
- 2026-10-21: 本项目 Rsbuild 会解析 CSS 的 `url()`：在 `src/index.css` 引入 `public/` 中字体时使用相对路径，由构建生成哈希资源；直接写 `/fonts/...` 曾导致 css-loader 无法解析。以生产构建及实际 Rendered Fonts 验证结果为准。
- 2026-10-21: 筛选区与 Modal 复用同名 AntD 字段时，为各 Form 设置独立 `name`，避免重复 DOM id 导致 label 指向错误控件。jsdom 验证 Modal 收起时可在测试 ConfigProvider 关闭 motion，保留可访问性和业务断言，避免等待不会自然完成的 CSS 动画。
- 2026-05-07: 复杂组件不能依赖默认行为；回填、提交、搜索参数、父子联动规则必须显式定义并测试覆盖。
- 2026-05-07: 初始化加载与条件加载要拆分 effect，并稳定依赖引用，避免重复请求与渲染抖动。 #promote
- 2026-05-07: 枚举值域应单一来源，筛选项/表格展示/提交语义共用同一映射常量，防止多处漂移。
- 2026-05-07: 列表工具栏与操作列采用统一规范（刷新/密度/列设置复用，操作列右侧固定、右对齐、宽度开发期固定）。
- 2026-05-09: 标准列表曾因请求链路依赖抖动，在勾选行或打开弹窗时重新触发首屏加载。2026-10-22 核对：当前 use-latest-request 将 request/错误回调存 ref，controller 也通过 ref 读取 transformResponse；应保持查询参数身份与 load 稳定，选择状态变化不应重刷。保留原根因，不再将所有 request/transformResponse 引用变化断言为必然重刷，也不新增强制所有回调 useCallback 的规则。
- 2026-05-13: 批量操作同时涉及选中项和筛选结果时，先核对该页面的业务作用域，再复用已有分页队列，避免两套逻辑漂移。2026-10-22 核对：订舱页已有 useBatchQueueTask 与全量 ID 获取；MSK 页处理选中项或当前页，不证明两者具有相同的“全量筛选”语义。保留有条件的复用建议，未证明共同行为前不新增统一作用域抽象，也不因此开始重构。
- 2026-06-01: 提醒列表 `is_use` 的展示语义以当前用户口径为准，不能继续沿用旧版 public 参考；当“已作废/未作废”口径调整时，单条与批量作废的前端拦截条件也要同步调整，避免文案和行为反向漂移。
- 2026-06-06: 大表格列表页测试头部按钮时，优先基于 `.list-card-header-*` 容器断言文本或局部节点，避免对整页使用全局 `getByRole/getByText` 导致超时（如 `book-task-list`）。
- 2026-06-06: 显式启用 Antd Table 的真实 virtual 时，scroll.x 和 scroll.y 都须为数字，不能沿用 max-content。2026-10-22 核对：当前标准 recipe 默认不提供 virtualScroll，MSK 也未启用 virtual；原“复用 virtualScroll.scroll”的描述仅属于历史实现，不是当前可用 API。本条作为未来明确启用时的条件经验保留，不据此恢复虚拟滚动。
- 2026-06-06: Antd `Table` 的可排序列若通过 `onHeaderCell: () => 常量对象` 复用同一个返回值，排序注入会把 `aria/className/onClick` 串写到其他表头；共享层启用多列排序时必须先把 `onHeaderCell` 返回值克隆成每列独立对象。 #promote
- 2026-06-06: msk-query-list 的“备注”前端字段为 tips，不应误写到 log。原记录中的“log 承担航线/链接映射”保留为当时的语义背景；2026-10-22 核对，当前航线显示来自 resolveHostByDestination/host-map，log 仅原样透传，未核实服务端完整含义。不能把历史描述当作当前映射机制或据此改接口字段。
