import '@/assets/stylesheets/globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { router } from '@/routes'
import { Provider } from 'jotai'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { SWRConfig } from 'swr'
import { fetcher } from './lib/utils'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <SWRConfig value={{ fetcher }}>
      <Provider>
        <ThemeProvider>
          <RouterProvider router={router} />
        </ThemeProvider>
      </Provider>
    </SWRConfig>
  </React.StrictMode>
)
