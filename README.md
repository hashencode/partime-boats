# Boats

A reusable admin template built with React, TypeScript, Ant Design v6, Tailwind CSS, ESLint, and Prettier.

## Stack

- React 19
- TypeScript
- Ant Design v6
- Tailwind CSS
- Rsbuild (bundler)
- RSTest + Testing Library

## Scripts (Bun)

- `bun run dev:development` - start development server with `.env.development`
- `bun run dev:test` - start development server with `.env.test`
- `bun run dev:production` - start development server with `.env.production`
- `bun run build` - typecheck and build production bundle
- `bun run build:test` - build with `.env.test`
- `bun run build:production` - build with `.env.production`
- `bun run preview` - preview production build
- `bun run preview:test` - preview with `.env.test`
- `bun run preview:production` - preview with `.env.production`
- `bun run test` - run unit tests

## Structure

- `src/routes` - route config, router builder, and provider
- `src/routes/form-route-contract.ts` - form route mode contract utilities
- `src/infrastructure/auth` - role and permission sandbox
- `src/infrastructure/http` - shared HTTP client and error normalization
- `src/infrastructure/msw` - dev-only MSW bootstrap and handlers (`/dev` routes only)
- `src/pages/home/*` - public pages
- `src/pages/templates/*` - template pages and feature API modules
- `src/shared/layout` - admin shell layout
- `src/shared/contexts` - global cross-page runtime contexts (for example theme mode)
- `src/shared/hooks` - reusable React hooks (for example table pagination behavior)
- `src/shared/utils` - focused pure helpers (for example display name normalization)

## Notes

- No Ant Design Pro is used.
- Routing, permissions, and menu are driven by typed route contracts.
- Theme mode supports `light` / `dark` / `system`; avoid hardcoded light-only background colors in new UI code.

## Documentation

- [AI development navigation](docs/ai/README.md)
- [Collaboration and implementation rules](docs/ai/development-rules.md)
- [Project memory workflow](docs/ai/project-memory.md)
- [Business routing map](docs/ai/business-map.yaml), [component catalog](docs/ai/component-catalog.yaml), [page recipes](docs/ai/page-recipes.yaml), and [implementation rules](docs/ai/ai-rules.md)
- [API navigation](docs/api/README.md) and [testing standards](docs/testing-standards.md)
- Existing [plans and verification records](docs/plans/) remain in place.

Commands above follow the current package.json scripts; development uses `bun run dev:development`.

## 文档入口

- [项目文档总导航](docs/README.md)：开发规则、接口或协议、验证要求及项目专题。
- [AI 开发文档导航](docs/ai/README.md)：按任务读取适用规则；既有约束和历史验收继续按原范围生效。
