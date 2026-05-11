declare module '*.css'
declare const __ENABLE_TEMPLATE_ROUTES__: boolean

interface ImportMetaEnv {
  readonly DEV: boolean
  readonly PROD: boolean
  readonly PUBLIC_API_BASE?: string
  readonly PUBLIC_MODE?: 'development' | 'test' | 'production'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
