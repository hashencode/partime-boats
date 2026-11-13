# 9112 / 9113 / 9114 端口调整验收

日期：2026-11-12（Asia/Shanghai）。按用户要求在 `124.70.141.127` 调整端口，未创建 worktree、提交代码或修改业务源码。

## 服务器结果

| 端口 | 当前服务 | 状态 |
| --- | --- | --- |
| 9112 | 原 Reporting System API，`reporting-system-9112.service` | active、enabled，公网只读检查通过 |
| 9113 | `partime-boats` | Nginx 正常监听，本机与 SSH 隧道验收通过，等待云侧放行 |
| 9114 | `partime-boat-monitor` | Nginx 正常监听，本机与 SSH 隧道验收通过，等待云侧放行 |

Boats 静态目录为 `/usr/share/nginx/partime-boats-9113`，站点配置为 `/etc/nginx/conf.d/partime-boats-9113.conf`。原 API 程序仍为 `/opt/reporting-system-9112/app/reporting_api`，沿用其原 systemd 服务定义及 uWSGI 启动参数，没有重新实现服务。

## 验证证据

- 候选 Nginx 配置及正式完整配置均通过 `nginx -t`，reload 成功；Nginx 主进程没有重启，保持 active、enabled。
- 原 API 恢复 9112 后，公网 `GET /admin/login` 返回 HTTP 200、`bool_status=true`；服务为 active、enabled。未尝试业务登录或执行业务写入。
- Boats 48 个静态文件的 SHA-256 与迁移前一致；通过 SSH 隧道逐一获取的文件也全部一致。`/`、`/login`、`/get_book_task_list` 回退到同一入口，浏览器匿名访问进入登录页。
- Boats `/api/maersk/book/task` 继续返回预期匿名 HTTP 401；9111 后端对 9113 来源、Authorization 请求头的只读查询预检通过。
- monitor 13 个生产文件上传及 HTTP 获取校验通过；`/pagesOne`、`/pagesTwo` 普通路径入口、读取接口和拒绝路径通过，详见其仓库 9114 部署验收。
- 服务器主 Nginx 配置和 80 原站入口文件哈希与切换前一致，9111 的两个原监听进程保持原 PID。
- 浏览器经 SSH 隧道验证 Boats 登录页、Monitor、任务查询及刷新通过，均无页面脚本错误；monitor 的两个读取接口均返回 200。
- 迁移完成后已清理旧 Boats 静态目录和服务器上传临时目录，保留当前两个站点目录。
- 未对真实计数清零路径发送请求，未修改 `123.60.22.89` 的旧站、后端或 FRP 服务。

## 尚未通过的公网验收

9113、9114 在服务器本机正常，公网连接超时或重置；服务器 firewalld 未运行，iptables 各链策略为 ACCEPT 且没有拦截规则。判断为云侧入站限制，已请求用户放行 TCP 9113、9114。未取得放行结果前，不将两站记录为公网验收通过。

证据位于 `.artifacts/deployments/2026-11-12-port-migration/`；截图位于 `.artifacts/screenshots/2026-11-12-port-migration/`，通过 SSH 隧道访问服务器，不能替代公网验收。临时产物均被 `/.artifacts/` 忽略。
