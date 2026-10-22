# 项目文档导航

航运后台项目；保留项目记忆、独立表单页、列宽测量和接口约束。

## 常用入口

| 内容 | 入口 |
| --- | --- |
| 仓库规则与授权 | [../AGENTS.md](../AGENTS.md) |
| 按任务读取开发文档 | [ai/README.md](ai/README.md) |
| 核心开发规范 | [development-rules.md](ai/development-rules.md) |
| 接口、协议或资源契约 | [api/README.md](api/README.md) |
| 验证要求 | [testing-standards.md](testing-standards.md) |
| 启动与项目说明 | [../README.md](../README.md) |

## 文档目录

- [ai/](ai/README.md)：按任务选择开发规则，不保存第二份业务接口或验收结论。
- [api/](api/README.md)：原接口和协议的索引；详细合同保持原有权威。
- [plans/](plans/)：保留原日期和范围的实施计划。

## 命名与维护

- `README.md` 用于入口；核心开发规范统一使用 `ai/development-rules.md`，需要独立维护的开发流程使用 `ai/development-workflow.md`，测试标准使用 `testing-standards.md`。已有专题或工具权威按下述例外保留，不为凑齐名称新增空文件或重复政策。
- 新增普通 Markdown 文件使用英文小写和短横线，以具体主题命名；计划、审计与验收记录按 `YYYY-MM-DD-主题.md` 命名。持续维护的规范不加日期，工具要求的文件名和既有历史记录不批量改名。
- 同一规则只维护一份正文，其他入口通过链接引用。文档中的相对链接以所在文件为基准；明确标注为仓库代码路径的内容以根目录为基准。改名或移动前检查正文职责、链接、脚本和规则路由消费者，同步修复有效引用。
- 当前规则、实施计划和验收证据分开维护；历史记录保留原日期、环境、来源、未验证项和结论。本次目录整理不代表重新验收，也不扩大组件库、工作树、设备或生产操作授权。

## 本项目保留的结构

- 核心协作与页面实现规范统一在 `ai/development-rules.md`；recipe、catalog、专项规则和迁移工作流保留各自职责、原优先级与适用范围。

## 存量整理结果

2026-10-22 本轮记忆整理已完成，见 [结项记录](plans/2026-10-22-memory-cleanup-proposals.md)。真实经验与历史验收保留，保留项已结项，不再反复列为下一批清理。
