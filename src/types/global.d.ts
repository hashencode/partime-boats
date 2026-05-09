declare module '*.css'
declare const __ENABLE_TEMPLATE_ROUTES__: boolean

interface ImportMetaEnv {
  readonly DEV: boolean
  readonly PROD: boolean
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
