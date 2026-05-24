import { createContext, useContext } from 'react'

type RouteTitleContextValue = {
  title: string | null
}

const RouteTitleContext = createContext<RouteTitleContextValue>({
  title: null,
})

export const RouteTitleProvider = RouteTitleContext.Provider

export const useRouteTitle = () => useContext(RouteTitleContext)
