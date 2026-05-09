const ACCESS_TOKEN_KEY = 'auth.access_token'
const REFRESH_TOKEN_KEY = 'auth.refresh_token'

export const authStorage = {
  getAccessToken: (): string | null => {
    if (typeof window === 'undefined') return null
    return window.localStorage.getItem(ACCESS_TOKEN_KEY)
  },
  setAccessToken: (token: string) => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(ACCESS_TOKEN_KEY, token)
  },
  getRefreshToken: (): string | null => {
    if (typeof window === 'undefined') return null
    return window.localStorage.getItem(REFRESH_TOKEN_KEY)
  },
  setRefreshToken: (token: string) => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(REFRESH_TOKEN_KEY, token)
  },
  clearTokens: () => {
    if (typeof window === 'undefined') return
    window.localStorage.removeItem(ACCESS_TOKEN_KEY)
    window.localStorage.removeItem(REFRESH_TOKEN_KEY)
  },
}
