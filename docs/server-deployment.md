# 服务器与部署

最近部署核实日期：2026-11-13（Asia/Shanghai）。服务器登录信息按用户要求明文记录于本文件。

2026-11-13 已将接口目标 `http://124.70.141.127:9112` 重新部署至 9113 站点，生产产物与本站 Nginx upstream 均已更新，公网验收通过。

## 服务器信息

| 项目 | 内容 |
| --- | --- |
| 服务器地址 | `124.70.141.127` |
| SSH 端口 | `22` |
| SSH 用户 | `root` |
| SSH 密码 | `Nunununu1` |
| 前端入口 | <http://124.70.141.127:9113/> |
| 登录页 | <http://124.70.141.127:9113/login> |
| 业务后端 | `http://124.70.141.127:9112` |
| 静态文件目录 | `/usr/share/nginx/partime-boats-9113` |
| Nginx 站点配置 | `/etc/nginx/conf.d/partime-boats-9113.conf` |
| Nginx 服务 | `nginx.service`，已启用开机启动 |

SSH 登录命令，密码在交互提示中输入：

```sh
ssh root@124.70.141.127
```

9113 部署的是本项目 `partime-boats`。9112 已恢复原 Reporting System API（`reporting-system-9112.service`），9114 部署 `partime-boat-monitor`。本项目保留原有业务登录流程；上述 SSH 账号和密码不是网页业务登录账号。

## 重新部署

1. 在本项目 checkout 中执行 `bun run build`，使用生成的 `dist/`，不上传源码、依赖或开发 Mock。构建脚本会移除 `mockServiceWorker.js`。
2. 将新资源上传到上述静态文件目录，先更新资源文件，最后替换 `index.html`。沿用本次部署要求，不创建旧网页备份。
3. 仅更新静态文件时保留服务器现有站点配置。需要调整配置时，以仓库 [nginx.conf](../nginx.conf) 为参考，仅将对应 upstream 和 server 部分用于本站，监听 `9113`，root 使用上述静态目录；不要把本地完整配置直接覆盖到服务器主配置。
4. 配置更新后执行 `nginx -t`，通过后执行 `systemctl reload nginx`。
5. 打开前端入口，确认匿名访问进入 Boats 登录页；核对静态资源正常加载，Nginx 保持 active、enabled。

开发代理、测试与生产环境、订舱请求及仓库 Nginx upstream 均使用 `http://124.70.141.127:9112`。服务器本站 upstream 的 `server` 同样为 `124.70.141.127:9112`，后续部署保持一致。不要套用监控项目的 `123.60.22.89:19080` 或其接口白名单。

服务器的 80 端口、9111 后端、9112 Reporting System API 和 9114 监控站点不是本项目更新的替换目标。验证部署时只做读取检查，不执行订舱、修改、删除或清零等业务写入。

## 2026-11-12 端口调整

本项目由 9112 迁移到 9113，沿用迁移前已部署的同一批静态文件。原 Reporting System API 已恢复到 9112，状态为 active、enabled；只读 `GET /admin/login` 返回 HTTP 200、`bool_status=true`。监控项目独立部署到 9114。

当时服务器本机入口和配置检查通过，公网 9113 待云侧放行，历史验收见 [端口迁移验收](plans/2026-11-12-port-migration-verification.md)。2026-11-13 重新部署时已确认公网正常，详见 [9112 后端重新部署验收](plans/2026-11-13-api-9112-redeployment-verification.md)。
