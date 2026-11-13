# 9112 后端重新部署验收

日期：2026-11-13（Asia/Shanghai）。按用户要求将当前 `partime-boats` checkout 重新部署至 `124.70.141.127:9113`，使此前确认的 9112 接口目标在线上生效。

## 部署结果

- 入口：`http://124.70.141.127:9113/`；匿名访问进入 Boats `/login`。
- 生产文件目录：`/usr/share/nginx/partime-boats-9113`。先上传和验证资源，最后原子替换 `index.html`。
- 站点配置：`/etc/nginx/conf.d/partime-boats-9113.conf`。与部署前配置比较，仅将本站 upstream 从 `124.70.141.127:9111` 改为 `124.70.141.127:9112`。
- 浏览器生产请求及 `/api/` 代理均使用 9112。已部署的当前生产 JavaScript 中不含旧 9111 接口目标。
- 未创建旧网页备份。Nginx 通过配置检查后 reload，主进程保持 PID 10756，服务继续 active、enabled。

## 验证

| 检查 | 结果 |
| --- | --- |
| 本地验证 | 沿用同一实现已通过的 44 项相关测试和 ESLint；本次未修改业务源码，部署前重新运行 `bun run build`，类型检查及生产构建通过 |
| 文件一致性 | 48 个生产文件在服务器 SHA-256 校验通过；公网逐一读取后与本地构建完全一致 |
| 页面路由 | `/`、`/login`、`/get_book_task_list` 返回当前生产入口，HTTP 200 |
| 浏览器 | 公网访问正常显示 Boats 登录页，未启用 Mock |
| 代理与直连 | 本站 `/api/maersk/book/task` 和直连 9112 的读取请求均返回预期匿名 HTTP 401 JSON |
| 跨域预检 | 9112 对 9113 来源的登录 POST 预检和含 Authorization 的查询 GET 预检均通过；仅发送 OPTIONS，未发送真实登录 POST |
| Nginx | 候选配置及服务器完整配置 `nginx -t` 均通过，reload 成功；服务器本站配置哈希与候选一致 |
| 其他服务 | 9111 与 9112 的原 uWSGI PID 保持；Reporting System API 继续 active、enabled；80 和 9114 返回 HTTP 200 |
| 配置边界 | 服务器主 Nginx 配置、80 原站入口和 9114 站点配置的部署前后 SHA-256 均一致 |

本次 `index.html` SHA-256：`f785aa70088462c3ed60b1cc133bd82765a5c61d2bbafa5eb2ab65e4ab72018e`。

本站配置 SHA-256：`c941270af4fc2dde448b51e66777130e119ba372880d6f7ece2720b558478262`。

未使用 SSH 账号尝试业务登录，未验证登录后的真实业务操作，也未执行订舱、修改、删除或清零。本次未创建 worktree、提交或推送代码。

构建归档、文件清单、候选配置及公网校验结果位于 `.artifacts/deployments/2026-11-13-api-9112-redeploy/`，截图位于 `.artifacts/screenshots/2026-11-13-api-9112-redeploy/deployed-login.jpg`，均被 Git 忽略。服务器本次上传临时目录已清理。
