# Testing Standards

## 1. Goal
统一测试质量基线，确保新增页面测试具备可维护性、可回归性和生产可用性。

## 2. Test Layering (Mandatory)
1. Rstest + jsdom: 默认层，用于单元/组件测试与快速反馈。
2. Rstest Browser Mode: 用于真实浏览器行为验证，补齐 jsdom 盲区。
3. Playwright E2E: 用于关键业务链路的端到端冒烟验证，少而精。

## 3. Naming and Placement (Mandatory)
- Unit/Component: `src/**/*.test.ts(x)` 或 `src/**/*.spec.ts(x)`
- Browser Mode: `src/**/*.browser.test.ts(x)`
- E2E: `e2e/**/*.spec.ts`

推荐测试命名格式：
- `it('should <behavior> when <condition>')`

## 4. Minimum Coverage Checklist

### 4.1 List Page
- 首次加载成功渲染
- 筛选变更不自动请求，点击“查询”后请求
- 重置筛选恢复默认
- 新增/编辑/查看跳转正确
- 接口失败态（标题 + 描述 + 恢复动作）
- 空态提示与恢复动作
- 权限测试：无写权限用户不可见写操作
- 至少一个参数或数据边界场景

### 4.2 Form Page
- `add / modify / readonly` 三态
- 非法 `mode` 参数错误态
- `readonly` 提交阻断（UI 与行为都验证）
- 提交成功提示与跳转
- 提交失败提示
- 权限拒绝（403）
- 至少一个字段边界（空值/超长/非法类型）

### 4.3 Security Minimum Set
- 权限矩阵单测（角色到权限）
- 写操作权限阻断（入口与行为）
- 路由参数非法/缺失拦截
- HTTP 错误归一化（timeout/404/5xx/unknown）

## 5. Definition of Done (Testing)
- `bun run test` 全绿
- 每个新增功能至少包含：
  - 1 个 happy path
  - 1 个 failure/edge path
- 不允许仅“渲染存在”断言，必须覆盖用户动作与结果
- 占位页面不得保留误导性通过测试

## 6. Browser Mode vs Playwright E2E Guidance
- Browser Mode 适用：真实 DOM/CSS/浏览器 API 行为验证。
- Playwright E2E 适用：登录、跨页面、权限链路、后端联动的完整旅程。
- 推荐比例：70% jsdom、20% Browser Mode、10% E2E。

## 7. Workflow Rule (Mandatory)
在创建或修改测试文件前，必须先阅读本文件；若与历史做法冲突，以本文件为准。

## 8. Template Files
- 新页面单元/组件测试模板：`src/test/templates/new-page.test.template.tsx`
- Browser Mode 模板：`src/test/templates/new-page.browser.test.template.tsx`
- Playwright E2E 模板：`e2e/templates/new-flow.e2e.template.spec.ts`
