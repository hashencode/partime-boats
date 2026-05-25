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

- `bun run dev` - start development server
- `bun run dev:development` - start development server with `.env.development`
- `bun run dev:test` - start development server with `.env.test`
- `bun run dev:production` - start development server with `.env.production`
- `bun run build` - typecheck and build production bundle
- `bun run build:development` - build with `.env.development`
- `bun run build:test` - build with `.env.test`
- `bun run build:production` - build with `.env.production`
- `bun run preview` - preview production build
- `bun run preview:development` - preview with `.env.development`
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

## AI Documentation Pack

- Index: `docs/ai/README.md`
- Business routing map: `docs/ai/business-map.yaml`
- Component catalog: `docs/ai/component-catalog.yaml`
- Page recipes: `docs/ai/page-recipes.yaml`
- Rules: `docs/ai/ai-rules.md`
