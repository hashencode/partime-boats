# 本次网站调整涉及的现有接口

核实日期：2026-10-21。后端保持不变；以下写入格式来自现有前端调用，使用本地 MSW 测试验证请求和失败处理，未对真实接口执行写入测试。接口返回成功不等于已经验证新增字段在服务器落库。

| 用途 | 方法与路径 | 本次使用的参数 | 验证范围 |
| --- | --- | --- | --- |
| 订舱任务列表 | `GET /maersk/book/task` | `page`、`per_page`、现有筛选参数，含 `cid_group`、`group_id`、`list_type` | 已只读确认列表返回 `list_type`，且该筛选可用 |
| 单条任务修改 | `POST /maersk/book/task` | 保留现有完整修改参数及 `id`，增加数值型 `list_type` | 仅验证客户端请求；新增字段的真实保存尚未验证 |
| 批量任务修改 | `POST /maersk/group/task` | `ids` 为逗号分隔的 ID；修改列表分组时发送数值型 `list_type` | 仅验证客户端请求；新增字段的真实保存尚未验证 |
| 批量关闭任务 | `POST /maersk/group/task` | `ids` 为逗号分隔的 ID，`is_order: 0` | 沿用单行开关的关闭字段与批量打开的多 ID 调用方式；多任务关闭尚未真实写入验证 |

写接口要求 `bool_status: true` 才显示成功；明确失败或无法确认成功的响应均保留错误反馈。`list_type: 0` 是有效值，不按空值丢弃；批量修改未填写该字段时不发送。

批量关闭先读取并冻结目标 ID，再每批提交 100 个。已勾选时仅处理勾选任务；未勾选时读取上一次点击“查询”后生效的筛选结果全部分页，无筛选时为全部任务。确认窗口展示范围和数量；失败后暂停，可重试失败批次或结束，不重复提交此前成功的批次。读取分页数量不完整、重复 ID 或总数变化时中止，要求重新查询。

账号列表的 500/1000 条分页请求单独使用 20 秒超时，其他请求继续沿用现有默认超时。日志与账号列表请求失败时保留旧数据，并明确提示“本次列表未更新”及重试入口。日志原有 `shipping_line` 在当前页过滤及“全部”的能力边界不在本次调整范围内。


## MSK 账号管理接口

文档核对日期：2026-11-23。来源：[订舱账号](https://o5bo7eto3k.apifox.cn/9663443m0)、[查询账号](https://o5bo7eto3k.apifox.cn/9664881m0)。本节依据 Apifox 的字段说明和响应示例；客户端请求与错误处理使用本地测试验证，未执行真实账号新增、修改、删除或导入，不代表已验证服务端落库。现有订舱任务接口的 `bool_status` 规则保持原适用范围，不扩展为本节接口必须返回的字段。

| 能力 | 订舱账号 | 查询账号 |
| --- | --- | --- |
| 分页查询 | GET `/maersk/book/list` | GET `/maersk/list` |
| 单条新增 | 无 | POST `/maersk/account` |
| 单条修改 | POST `/maersk/book/list` | POST `/maersk/list` |
| 删除 | 无 | DELETE `/maersk/account/{account_id}` |
| Excel 导入 | POST `/maersk/book/account/import` | POST `/maersk/account/import` |

请求继续复用 apiClient 的同源代理和 Bearer 认证。列表参数为 page、per_page、account_type、account、is_refresh_use、is_use、use_type；账号模糊匹配，两个布尔字段取 0/1，类型字段是非负整数。默认 page=1、per_page=100、account_type=1，0 不当作空值省略。

文档中的列表行位于响应 `data.data`，分页位于 `data.pagination`，字段为 total、page、per_page、total_pages。客户端同时兼容现有列表的直接 data 数组与 pagination 结构、current_page/last_page 别名及 bool_status 包装，兼容分支不代表新文档承诺这些字段。列表缺少实体身份时展示不完整结果，不能用行号代替写操作目标。

成功响应没有统一的业务成功标志；按操作需要验证结构和结果。文档失败响应含 error_code 和 message，即使 HTTP 200 也按失败处理；不猜 error_code=0 就是成功。订舱修改、删除示例将结果放在 data，查询修改、新增和两个导入示例直接返回结果对象，领域适配兼容这两种已文档化结构。旧 bool_status=false 仍按失败处理，原有公共解包函数不变。

新增使用 account/password，密码必须非空并保留首尾空格；可选 account_type、customer_code、use_type、is_use、is_refresh_use。文档默认类型及布尔字段均为 1，客户代码为空文本。修改以 `_id` 精确定位，只写 account、password、use_type、is_use、is_refresh_use 中实际改变的字段；密码空字符串省略。matched 为 0 视为目标不存在，modified 为 0 可以是成功但未改变数据。删除以 `_id` 作为路径参数，deleted 为 0 表达目标已不存在。

未文档化单条详情接口。前端用原账号名称和账号类型缩小列表检索范围，再遍历分页精确匹配 `_id`；原账号名称不是目标身份，也不能用模糊结果第一条回填。

两类导入均通过 multipart/form-data 的 file 字段上传 `.xlsx`，优先读取 maersk_book_account 工作表，否则使用活动表。表头必含 account、password，列顺序不限；新增行密码必填，空单元格保留原值，账号和客户代码使用文本格式以保留前导零。匹配账号则修改，否则新增；同文件重复账号按顺序处理，后续非空值覆盖前值。所有行先校验再写入，写入中断仍可能保留已处理行，因此超时后不自动重传。服务端返回 total/inserted/matched/modified，分别展示实际处理数量。查询账号导入文档明确忽略 `_id` 列，订舱文档未明确该细节，导入文件不依赖 `_id` 修改目标。

没有专用导出接口。当前页导出只使用最近成功读取的当前页，显式列出业务字段，按用户确认包含明文密码。导出不请求其他分页；结果加载中、部分结果或读取失败未更新时禁用。真实凭据不用于自动化测试和验收截图。
