# API 文档导航

本项目现有接口资料以 [api.md](api.md) 为准；方法和路径不能按模板猜测。该文件记录 2026-10-21 网站调整涉及的部分接口，不是完整后端接口目录。

## 阅读顺序与来源

1. 先读 [api.md](api.md)，区分已只读核实的列表行为、本地 MSW 请求验证与尚未完成的真实写入验证。
2. 再读对应业务模块的 api.ts、类型和测试。例如 [订舱任务 API](../../src/pages/templates/book-task-list/api.ts) / [API 测试](../../src/pages/templates/book-task-list/api.test.ts)，以及 [账号 API](../../src/pages/templates/book-account-list/api.ts) / [API 测试](../../src/pages/templates/book-account-list/api.test.ts)。
3. 公共传输与错误归一化读取 [src/infrastructure/http/](../../src/infrastructure/http/)，不在页面另建请求体系。
4. `api.md` 尚未覆盖的接口，结合实际调用与可信后端资料核实后补文档，不把猜测或 MSW mock 写成服务端保证。[todo.md](todo.md) 保留原位，空文件不代表接口已核实。

## 保留的契约与验收边界

- 请求默认同源 `/api`，开发通过现有 proxy 转发；代理设置与实际调用共同确认最终路径。
- `bool_status: true` 才显示写入成功；`list_type: 0`、批量未填写字段、冻结 ID 与每批 100 个、失败暂停/重试等细则继续以 api.md 为准。
- 账号 500/1000 条分页的独立超时和列表失败保留旧数据的行为也保留；不借文档整理改变其他请求默认值。
- 本地测试不能证明新增字段已在真实服务落库。真实写入、生产数据和外部系统调用不因补文档自动获得授权。

接口变更时同步调用代码、类型、相关测试和文档，验收说明实际环境与验证范围。原 [计划与验收记录](../plans/) 保留原位。
